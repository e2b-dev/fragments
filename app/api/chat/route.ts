import {
  streamObject,
  LanguageModel,
} from 'ai'

import { Templates, templatesToPrompt } from '@/lib/templates'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { artifactSchema as schema } from '@/lib/schema'

export const maxDuration = 60

export async function POST(req: Request) {
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
    system: `You are a skilled developer. You do not make mistakes. Generate an artifact. You can install additional dependencies. You can use one of the following templates:\n${templatesToPrompt(template)}`,
    prompt,
    ...modelParams,
  })

  return stream.toTextStreamResponse()
}
