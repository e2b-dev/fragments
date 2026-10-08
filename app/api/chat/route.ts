import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import {
  getClientApiKey,
  getModelClient,
  getModelParams,
  resolveModel,
} from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { chatRequestSchema, parseRequest } from '@/lib/request-schema'
import { fragmentSchema as schema } from '@/lib/schema'
import { streamObject, LanguageModel } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const request = await parseRequest(req, chatRequestSchema)
  if ('error' in request) {
    return request.error
  }
  const { messages, userID, teamID, template, model, config } = request.data

  const llm = resolveModel(model.id)
  if (!llm || llm.providerId !== model.providerId) {
    return new Response('Unsupported model', { status: 400 })
  }

  // Requests sent with the server's keys are rate limited.
  const hasOwnApiKey = !!getClientApiKey(llm, config)
  const limit = !hasOwnApiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return createRateLimitResponse(limit)
  }

  console.log('userID', userID)
  console.log('teamID', teamID)
  // console.log('template', template)
  console.log('model', model)
  // console.log('config', config)

  const modelClient = getModelClient(llm, config)

  try {
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      system: toPrompt(template),
      messages,
      maxRetries: 0, // do not retry on errors
      ...getModelParams(config),
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    return handleAPIError(error, { hasOwnApiKey })
  }
}
