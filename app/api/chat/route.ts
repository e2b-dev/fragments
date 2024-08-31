import {
  tool,
  LanguageModel,
  streamText,
  CoreMessage,
} from 'ai'

import ratelimit from '@/lib/ratelimit'
import { Templates, templatesToPrompt } from '@/lib/templates'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { artifactSchema as schema } from '@/lib/schema'
import { createSandbox } from '@/lib/sandbox'

export const maxDuration = 60

const rateLimitMaxRequests = 5
const ratelimitWindow = '1m'

const styleguide = `Use markdown to format your response.
Markdown code-blocks should be following the following format: \`\`\`language,filename\nCODE\n\`\`\`.`

function toSystemPrompt (template: Templates) {
  return `
  You are a skilled software engineer. You do not make mistakes. Generate an artifact according to user criteria.
  Describe the process step by step, which should include the code.
  Then, execute it using e2b tool.
  You can install additional dependencies.
  You can use one of the following sandbox templates:\n${templatesToPrompt(template)}
  ${styleguide}
  `
}

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

  const { messages, userID, template, model, config }: { messages: CoreMessage[], userID: string, template: Templates, model: LLMModel, config: LLMModelConfig } = await req.json()
  console.log('userID', userID)
  // console.log('template', template)
  console.log('model', model)
  console.log('config', config)
  // console.log('messages', messages)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  const stream = await streamText({
    model: modelClient as LanguageModel,
    system: toSystemPrompt(template),
    messages,
    tools: {
      e2b: tool({
        description: 'Execute code in a e2b sandbox',
        parameters: schema,
        execute: (artifact) => createSandbox({ artifact, userID })
      }),
    },
    ...modelParams,
  })

  return stream.toDataStreamResponse()
}
