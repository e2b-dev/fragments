import { LLMModel, LLMModelConfig } from './models'
import modelsData from './models.json'

interface ModelData {
  id: string
  provider: string
  providerId: string
  name: string
  multiModal: boolean
}

// Create a map of model ID to model data for fast lookup
const modelMap: Map<string, ModelData> = new Map()
modelsData.models.forEach((model: ModelData) => {
  modelMap.set(model.id, model)
})

export function getModelById(modelId: string): ModelData | null {
  return modelMap.get(modelId) || null
}

export function createLLMModelConfig(modelId: string): { modelConfig: LLMModel; config: LLMModelConfig } | null {
  const modelData = getModelById(modelId)
  if (!modelData) {
    return null
  }

  const modelConfig: LLMModel = {
    id: modelData.id,
    name: modelData.name,
    provider: modelData.provider,
    providerId: modelData.providerId
  }

  // Get the correct API key based on provider
  const getApiKeyForProvider = (providerId: string): string | undefined => {
    switch (providerId) {
      case 'openai':
        return process.env.OPENAI_API_KEY
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY
      case 'google':
        return process.env.GOOGLE_AI_API_KEY
      case 'mistral':
        return process.env.MISTRAL_API_KEY
      case 'groq':
        return process.env.GROQ_API_KEY
      case 'fireworks':
        return process.env.FIREWORKS_API_KEY
      case 'togetherai':
        return process.env.TOGETHER_API_KEY
      case 'xai':
        return process.env.XAI_API_KEY
      case 'deepseek':
        return process.env.DEEPSEEK_API_KEY
      case 'cerebras':
        return process.env.CEREBRAS_API_KEY
      case 'ollama':
        return process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      default:
        return undefined
    }
  }

  const config: LLMModelConfig = {
    model: modelData.id,
    apiKey: getApiKeyForProvider(modelData.providerId),
    temperature: 0.7,
  }

  return { modelConfig, config }
}

export function getAvailableModels(): ModelData[] {
  return modelsData.models
}