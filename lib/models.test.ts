import {
  getClientApiKey,
  getModelClient,
  getModelParams,
  LLMModelConfig,
  resolveModel,
} from './models'
import modelsList from './models.json'
import { generateText, LanguageModel } from 'ai'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

const customBaseURL = 'https://custom-endpoint.example/v1'

const providerHosts: Record<string, string> = {
  anthropic: 'api.anthropic.com',
  openai: 'api.openai.com',
  google: 'generativelanguage.googleapis.com',
  mistral: 'api.mistral.ai',
  groq: 'api.groq.com',
  togetherai: 'api.together.xyz',
  fireworks: 'api.fireworks.ai',
  xai: 'api.x.ai',
  deepseek: 'api.deepseek.com',
}

const providerEnvKeys = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'MISTRAL_API_KEY',
  'GROQ_API_KEY',
  'TOGETHER_API_KEY',
  'FIREWORKS_API_KEY',
  'XAI_API_KEY',
  'DEEPSEEK_API_KEY',
]

const originalFetch = globalThis.fetch
let requestedHosts: string[] = []
let requestedAuthorization: (string | null)[] = []

beforeEach(() => {
  for (const key of providerEnvKeys) {
    process.env[key] = 'test-key'
  }
  delete process.env.OLLAMA_BASE_URL
  requestedHosts = []
  requestedAuthorization = []
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString()
    requestedHosts.push(new URL(url).host)
    requestedAuthorization.push(new Headers(init?.headers).get('authorization'))
    throw new Error('network is disabled in tests')
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

function firstModelOf(providerId: string) {
  const model = modelsList.models.find((m) => m.providerId === providerId)
  assert.ok(model, `models.json has no ${providerId} model`)
  return model
}

async function sendPrompt(model: LanguageModel) {
  await generateText({ model, prompt: 'Hello', maxRetries: 0 }).catch(() => {})
}

describe('getModelClient', () => {
  for (const [providerId, host] of Object.entries(providerHosts)) {
    it(`sends ${providerId} requests to ${host}, ignoring a client base URL`, async () => {
      const config = { baseURL: customBaseURL } as LLMModelConfig
      const client = getModelClient(firstModelOf(providerId), config)

      await sendPrompt(client as LanguageModel)

      assert.deepEqual(requestedHosts, [host])
    })
  }

  it('sends ollama requests to OLLAMA_BASE_URL, ignoring a client base URL', async () => {
    process.env.OLLAMA_BASE_URL = 'http://ollama.test:11434/api'
    const config = { baseURL: customBaseURL } as LLMModelConfig
    const client = getModelClient(firstModelOf('ollama'), config)

    await sendPrompt(client as LanguageModel)

    assert.deepEqual(requestedHosts, ['ollama.test:11434'])
  })

  it('sends the caller key when one is provided', async () => {
    const config = { apiKey: 'user-key' }
    const client = getModelClient(firstModelOf('groq'), config)

    await sendPrompt(client as LanguageModel)

    assert.deepEqual(requestedAuthorization, ['Bearer user-key'])
  })

  it('sends the server key when the caller key is not a string', async () => {
    const config = { apiKey: { key: 'user-key' } } as unknown as LLMModelConfig
    const client = getModelClient(firstModelOf('groq'), config)

    await sendPrompt(client as LanguageModel)

    assert.deepEqual(requestedAuthorization, ['Bearer test-key'])
  })
})

describe('getClientApiKey', () => {
  it('returns the caller key for providers that use it', () => {
    for (const providerId of Object.keys(providerHosts)) {
      const model = firstModelOf(providerId)

      assert.equal(getClientApiKey(model, { apiKey: 'user-key' }), 'user-key')
    }
  })

  it('returns nothing for providers that use the server configuration', () => {
    for (const providerId of ['vertex', 'ollama']) {
      const model = firstModelOf(providerId)

      assert.equal(getClientApiKey(model, { apiKey: 'user-key' }), undefined)
    }
  })

  it('returns nothing for a missing, empty or non-string key', () => {
    const model = firstModelOf('openai')
    for (const apiKey of [undefined, '', 123, { key: 'user-key' }]) {
      const config = { apiKey } as unknown as LLMModelConfig

      assert.equal(getClientApiKey(model, config), undefined)
    }
  })
})

describe('resolveModel', () => {
  it('returns the model from models.json', () => {
    const model = firstModelOf('openai')

    assert.deepEqual(resolveModel(model.id), model)
  })

  it('rejects IDs that are not in models.json', () => {
    for (const id of ['not-a-model', 'constructor', undefined, 42]) {
      assert.equal(resolveModel(id), undefined)
    }
  })

  it('rejects ollama models unless OLLAMA_BASE_URL is set', () => {
    const model = firstModelOf('ollama')
    assert.equal(resolveModel(model.id), undefined)

    process.env.OLLAMA_BASE_URL = 'http://ollama.test:11434/api'
    assert.deepEqual(resolveModel(model.id), model)
  })
})

describe('getModelParams', () => {
  it('keeps only the sampling parameters', () => {
    const config = {
      model: 'gpt-5',
      apiKey: 'user-key',
      baseURL: customBaseURL,
      headers: { 'X-Custom': '1' },
      maxRetries: 5,
      temperature: 0.5,
      maxTokens: 100,
    } as LLMModelConfig

    assert.deepEqual(getModelParams(config), {
      temperature: 0.5,
      topP: undefined,
      topK: undefined,
      frequencyPenalty: undefined,
      presencePenalty: undefined,
      maxTokens: 100,
    })
  })
})
