import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import {
  getClientApiKey,
  getModelClient,
  getModelParams,
  resolveModel,
} from '@/lib/models'
import { applyPatch } from '@/lib/morph'
import ratelimit from '@/lib/ratelimit'
import { morphChatRequestSchema, parseRequest } from '@/lib/request-schema'
import { morphEditSchema } from '@/lib/schema'
import { generateObject, LanguageModel } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

// System prompt is constructed dynamically below using the current file context

export async function POST(req: Request) {
  const request = await parseRequest(req, morphChatRequestSchema)
  if ('error' in request) {
    return request.error
  }
  const { messages, model, config, currentFragment } = request.data

  const llm = resolveModel(model.id)
  if (!llm || llm.providerId !== model.providerId) {
    return new Response('Unsupported model', { status: 400 })
  }

  // Always rate limited: Morph Apply uses the server's Morph key even when
  // the model call uses the caller's key.
  const limit = await ratelimit(
    req.headers.get('x-forwarded-for'),
    rateLimitMaxRequests,
    ratelimitWindow,
  )

  if (limit) {
    return createRateLimitResponse(limit)
  }

  const modelClient = getModelClient(llm, config)

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

`

    const result = await generateObject({
      model: modelClient as LanguageModel,
      system: contextualSystemPrompt,
      messages,
      schema: morphEditSchema,
      maxRetries: 0,
      ...getModelParams(config),
    })

    const editInstructions = result.object

    // Apply edits using Morph
    const morphResult = await applyPatch({
      targetFile: currentFragment.file_path,
      instructions: editInstructions.instruction,
      initialCode: currentFragment.code,
      codeEdit: editInstructions.edit,
    })

    // Return updated fragment in standard format
    const updatedFragment = {
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
    return handleAPIError(error, {
      hasOwnApiKey: !!getClientApiKey(llm, config),
    })
  }
}
