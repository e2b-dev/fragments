import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
// @ts-ignore - TypeScript module resolution issue
import { applyPatch } from '@/lib/morph'
import { morphEditSchema } from '@/lib/morph-schema'
import ratelimit from '@/lib/ratelimit'
import { FragmentSchema } from '@/lib/schema'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

// System prompt for generating morph-compatible edits
const MORPH_SYSTEM_PROMPT = `You are a code editor assistant that generates precise edit instructions.

When the user asks for changes, you must provide:
1. commentary: Explain what changes you are making and why
2. instruction: A clear one-line description of what the edit accomplishes
3. edit: The specific code changes using the format:
   - Use // ... existing code ... to represent unchanged code
   - Show minimal context around changes
   - Be explicit about what to add, modify, or remove
4. file_path: The path to the file being edited (will be provided in context)

Example edit format:
// ... existing code ...
function oldName() {
  return 42
}
// ... existing code ...

Should become:
// ... existing code ...
function newName() {
  return 84
}
// ... existing code ...

Always provide enough context to unambiguously identify where the edit should be applied.

IMPORTANT: You must follow the exact schema with all required fields: commentary, instruction, edit, and file_path.`

export async function POST(req: Request) {
  
  const {
    messages,
    userID,
    teamID,
    model,
    config,
    currentFragment,
    morphApiKey,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    model: LLMModel
    config: LLMModelConfig
    currentFragment: FragmentSchema
    morphApiKey?: string
  } = await req.json()

  // Rate limiting (same as chat route)
  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
    const contextualSystemPrompt = `You are a code editor. Generate a JSON response with exactly these fields:

{
  "commentary": "Explain what changes you are making",
  "instruction": "One line description of the change", 
  "edit": "The code changes with // ... existing code ... for unchanged parts",
  "file_path": "${currentFragment.file_path}"
}

Current file: ${currentFragment.file_path}
Current code:
\`\`\`
${currentFragment.code}
\`\`\`

IMPORTANT: Return ONLY valid JSON. Do NOT wrap in markdown code blocks or backticks.`
    
    
    try {
      const { streamText } = await import('ai')
      
      const textStream = await streamText({
        model: modelClient as LanguageModel,
        system: contextualSystemPrompt,
        messages,
        maxRetries: 0,
        ...modelParams,
      })
      
      
      // Collect the full text response
      let fullResponse = ''
      for await (const chunk of textStream.textStream) {
        fullResponse += chunk
      }
      
      
      // Try to parse as JSON manually - strip markdown code blocks if present
      let editInstructions: MorphEditSchema
      try {
        // Remove markdown code blocks if present
        let jsonString = fullResponse.trim()
        if (jsonString.startsWith('```json')) {
          // Remove opening ```json and closing ```
          jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonString.startsWith('```')) {
          // Remove generic ``` blocks
          jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        editInstructions = JSON.parse(jsonString)
      } catch (parseError) {
        throw new Error(`LLM returned unparseable response: ${parseError.message}`)
      }
      
      // Validate the parsed response
      const validationResult = morphEditSchema.safeParse(editInstructions)
      if (!validationResult.success) {
        throw new Error(`Response doesn't match schema: ${validationResult.error.message}`)
      }
      
      editInstructions = validationResult.data

      // Step 2: Apply edits using Morph
      
      const morphResult = await applyPatch({
        target_file: currentFragment.file_path,
        instructions: editInstructions.instruction,
        initialCode: currentFragment.code,
        code_edit: editInstructions.edit,
        apiKey: morphApiKey,
      })

      // Step 3: Return updated fragment in standard format
      const updatedFragment: FragmentSchema = {
        ...currentFragment,
        code: morphResult.code,
        commentary: editInstructions.commentary,
      }

      // EXTRA LOGGING: confirm what is about to be sent to the client
      console.log('Morph route – updatedFragment ready to stream', {
        file_path: updatedFragment.file_path,
        codeLength: updatedFragment.code?.length,
        commentaryPreview: updatedFragment.commentary?.slice(0, 100),
      })
      
      // Create a streaming response that matches the AI SDK format
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          // Send the object in the format expected by useObject
          const json = JSON.stringify(updatedFragment)
          controller.enqueue(encoder.encode(json))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
      
    } catch (streamTextError) {
      
      // Fallback to original streamObject approach
      
      const editStream = await streamObject({
        model: modelClient as LanguageModel,
        schema: morphEditSchema,
        system: contextualSystemPrompt,
        messages,
        maxRetries: 0,
        ...modelParams,
      })
      
      // Just return the stream directly like the working chat route
      return editStream.toTextStreamResponse()
    }
  } catch (error: any) {
    
    // Reuse error handling patterns from main chat route
    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    
    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit.',
        { status: 429 }
      )
    }

    return new Response(
      `An error occurred: ${error.message}`,
      { status: 500 }
    )
  }
}
