import {
  streamObject,
  LanguageModel,
  CoreMessage,
  generateText,
} from 'ai'

import ratelimit from '@/lib/ratelimit'
import { Templates, templatesToPrompt } from '@/lib/templates'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { artifactSchema as schema } from '@/lib/schema'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 60

const rateLimitMaxRequests = 15
const ratelimitWindow = '1m'

export async function POST(req: Request) {
  const limit = await ratelimit('o1', rateLimitMaxRequests, ratelimitWindow)
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

  const { messages, userID, template, model, config }: { messages: CoreMessage[], userID: string, template: Templates, model: LLMModel, config: LLMModelConfig } = await req.json()
  console.log('userID', userID)
  // console.log('template', template)
  console.log('model', model)
  console.log('config', config)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  const systemPrompt = `You are a skilled software engineer. You do not make mistakes. Generate an artifact. You can install additional dependencies. You can use one of the following templates:\n${templatesToPrompt(template)}`

  messages.unshift({
    role: 'user',
    content: systemPrompt,
  })

  const { text } = await generateText({
    model: modelClient as LanguageModel,
    messages,
    ...modelParams,
  })

  const stream = await streamObject({
    model: openai('gpt-4o-mini') as LanguageModel,
    schema,
    system: `Please extract as required by the schema from the response. You can use one of the following templates:\n${templatesToPrompt(template)}`,
    prompt: text,
    ...modelParams,
  })

  return stream.toTextStreamResponse()
}
