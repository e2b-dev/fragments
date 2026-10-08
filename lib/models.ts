import modelsList from './models.json'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createFireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
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

// Finds the model in models.json. Ollama models are only available when
// OLLAMA_BASE_URL is set.
export function resolveModel(id: unknown): LLMModel | undefined {
  const model = modelsList.models.find((model) => model.id === id)
  if (model?.providerId === 'ollama' && !process.env.OLLAMA_BASE_URL) {
    return undefined
  }
  return model
}

export function getModelParams(config: LLMModelConfig) {
  const {
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    maxTokens,
  } = config
  return {
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    maxTokens,
  }
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey } = config

  const providerConfigs = {
    anthropic: () => createAnthropic({ apiKey })(modelNameString),
    openai: () => createOpenAI({ apiKey })(modelNameString),
    google: () => createGoogleGenerativeAI({ apiKey })(modelNameString),
    mistral: () => createMistral({ apiKey })(modelNameString),
    groq: () =>
      createOpenAI({
        apiKey: apiKey || process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      })(modelNameString),
    togetherai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.TOGETHER_API_KEY,
        baseURL: 'https://api.together.xyz/v1',
      })(modelNameString),
    ollama: () =>
      createOllama({ baseURL: process.env.OLLAMA_BASE_URL })(modelNameString),
    fireworks: () =>
      createFireworks({
        apiKey: apiKey || process.env.FIREWORKS_API_KEY,
        baseURL: 'https://api.fireworks.ai/inference/v1',
      })(modelNameString),
    vertex: () =>
      createVertex({
        googleAuthOptions: {
          credentials: JSON.parse(
            process.env.GOOGLE_VERTEX_CREDENTIALS || '{}',
          ),
        },
      })(modelNameString),
    xai: () =>
      createOpenAI({
        apiKey: apiKey || process.env.XAI_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      })(modelNameString),
    deepseek: () =>
      createOpenAI({
        apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
      })(modelNameString),
  }

  const createClient =
    providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}
