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
  hosted: boolean
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey } = config

  const providerConfigs = {
    anthropic: () => createAnthropic({ apiKey })(modelNameString),
    openai: () => createOpenAI({ apiKey })(modelNameString),
    google: () => createGoogleGenerativeAI({ apiKey })(modelNameString),
    mistral: () => createMistral({ apiKey })(modelNameString),
    groq: () => createOpenAI({ apiKey: apiKey || process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })(modelNameString),
    togetherai: () => createOpenAI({ apiKey: apiKey || process.env.TOGETHER_AI_API_KEY, baseURL: 'https://api.together.xyz/v1' })(modelNameString),
    ollama: () => createOllama()(modelNameString),
  }

  const createClient = providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}
