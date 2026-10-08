import { POST as chat } from './chat/route'
import { POST as morphChat } from './morph-chat/route'
import modelsList from '@/lib/models.json'
import templates from '@/lib/templates'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

const kvHost = 'kv.test'

const originalFetch = globalThis.fetch
let requestedHosts: string[] = []
let rateLimitChecked = false

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.FIREWORKS_API_KEY = 'test-key'
  process.env.GOOGLE_VERTEX_PROJECT = 'test-project'
  process.env.GOOGLE_VERTEX_LOCATION = 'us-central1'
  process.env.KV_REST_API_URL = `https://${kvHost}`
  process.env.KV_REST_API_TOKEN = 'test-token'
  requestedHosts = []
  rateLimitChecked = false
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    if (url.host === kvHost) {
      rateLimitChecked = true
      // Allow the request: the rate limiter sends a pipeline of sliding window
      // scripts, each answering [remainingTokens, limit].
      const commands: unknown[] = JSON.parse(String(init?.body))
      return Response.json(commands.map(() => ({ result: [10, 10] })))
    }
    requestedHosts.push(url.host)
    throw new Error('network is disabled in tests')
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

function firstModelOf(providerId: string) {
  return modelsList.models.find((m) => m.providerId === providerId)!
}

const routes = [
  { name: '/api/chat', POST: chat, body: { template: templates } },
  {
    name: '/api/morph-chat',
    POST: morphChat,
    body: { currentFragment: { file_path: 'app.py', code: 'print(1)' } },
  },
]

type Route = (typeof routes)[number]

function post(route: Route, model: unknown, config: object) {
  const body = {
    ...route.body,
    messages: [{ role: 'user', content: 'Build a counter app' }],
    model,
    config,
  }
  return route.POST(
    new Request(`http://localhost${route.name}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

for (const route of routes) {
  describe(route.name, () => {
    it('returns 400 for a model that is not in models.json', async () => {
      const response = await post(
        route,
        { id: 'not-a-model', providerId: 'openai' },
        {},
      )

      assert.equal(response.status, 400)
      assert.deepEqual(requestedHosts, [])
    })

    it('uses the provider from models.json and ignores a client base URL', async () => {
      await post(
        route,
        { ...firstModelOf('openai'), providerId: 'fireworks' },
        { baseURL: 'https://custom-endpoint.example/v1' },
      )

      assert.deepEqual(requestedHosts, ['api.openai.com'])
    })

    it('rate limits requests sent with the server keys', async () => {
      await post(route, firstModelOf('openai'), {})

      assert.equal(rateLimitChecked, true)
    })

    it('rate limits requests whose API key is not a string', async () => {
      await post(route, firstModelOf('openai'), { apiKey: 123 })

      assert.equal(rateLimitChecked, true)
    })

    it('rate limits vertex requests even with a caller key', async () => {
      await post(route, firstModelOf('vertex'), { apiKey: 'user-key' })

      assert.equal(rateLimitChecked, true)
    })
  })
}

describe('/api/chat with a caller key', () => {
  it('skips the rate limit', async () => {
    await post(routes[0], firstModelOf('openai'), { apiKey: 'user-key' })

    assert.equal(rateLimitChecked, false)
    assert.deepEqual(requestedHosts, ['api.openai.com'])
  })
})

describe('/api/morph-chat with a caller key', () => {
  it('still rate limits, because Morph Apply uses the server key', async () => {
    await post(routes[1], firstModelOf('openai'), { apiKey: 'user-key' })

    assert.equal(rateLimitChecked, true)
  })
})
