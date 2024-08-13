import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOllama } from 'ollama-ai-provider'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export function getModelClient(model: LLMModel, modelAPIKey?: string) {
  const { providerId, id: modelNameString } = model
  const config = { apiKey: modelAPIKey }

  const providerConfigs = {
    anthropic: () => createAnthropic(config)(modelNameString),
    openai: () => createOpenAI(config)(modelNameString),
    google: () => createGoogleGenerativeAI(config)(modelNameString),
    mistral: () => createMistral(config)(modelNameString),
    groq: () => createOpenAI({ ...config, baseURL: 'https://api.groq.com/openai/v1' })(modelNameString),
    togetherai: () => createOpenAI({ ...config, baseURL: 'https://api.together.xyz/v1' })(modelNameString),
    ollama: () => createOllama()(modelNameString),
  }

  const createClient = providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}
