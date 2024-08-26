import {
  streamObject,
  LanguageModel,
} from 'ai'

import ratelimit from '@/lib/ratelimit'
import { Templates, templatesToPrompt } from '@/lib/templates'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { artifactSchema as schema } from '@/lib/schema'

export const maxDuration = 60

const rateLimitMaxRequests = 5
const ratelimitWindow = '1m'

export async function POST(req: Request) {
  const limit = await ratelimit(req, rateLimitMaxRequests, ratelimitWindow)
  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString()
      }
    })
  }

  const { prompt, userID, template, model, config }: { prompt: string, userID: string, template: Templates, model: LLMModel, config: LLMModelConfig } = await req.json()
  console.log('userID', userID)
  // console.log('template', template)
  console.log('model', model)
  console.log('config', config)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  const stream = await streamObject({
    model: modelClient as LanguageModel,
    schema,
    system: `You are a skilled software engineer. You do not make mistakes. Generate an artifact. You can install additional dependencies. You can use one of the following templates:\n${templatesToPrompt(template)}`,
    prompt,
    mode: getDefaultMode(model),
    ...modelParams,
  })

  return stream.toTextStreamResponse()
}
