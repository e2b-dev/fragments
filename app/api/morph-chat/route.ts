import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
// @ts-ignore - TypeScript module resolution issue
import { applyPatch } from '@/lib/morph'
import { morphEditSchema, MorphEditSchema } from '@/lib/morph-schema'
import ratelimit from '@/lib/ratelimit'
import { FragmentSchema } from '@/lib/schema'
import { streamText, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

// System prompt is constructed dynamically below using the current file context

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

    // Parse as JSON manually - strip markdown code blocks if present
    let jsonString = fullResponse.trim()
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    let editInstructions: MorphEditSchema = JSON.parse(jsonString)

    // Validate the parsed response
    const validationResult = morphEditSchema.safeParse(editInstructions)
    if (!validationResult.success) {
      throw new Error(`Response doesn't match schema: ${validationResult.error.message}`)
    }

    editInstructions = validationResult.data

    // Apply edits using Morph
    const morphResult = await applyPatch({
      target_file: currentFragment.file_path,
      instructions: editInstructions.instruction,
      initialCode: currentFragment.code,
      code_edit: editInstructions.edit,
      apiKey: morphApiKey,
    })

    // Return updated fragment in standard format
    const updatedFragment: FragmentSchema = {
      ...currentFragment,
      code: morphResult.code,
      commentary: editInstructions.commentary,
    }

    // Create a streaming response that matches the AI SDK format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
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
