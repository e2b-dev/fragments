import { POST as chat } from './chat/route'
import { POST as morphChat } from './morph-chat/route'
import modelsList from '@/lib/models.json'
import templates from '@/lib/templates'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

const originalFetch = globalThis.fetch
let requestedHosts: string[] = []

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.FIREWORKS_API_KEY = 'test-key'
  requestedHosts = []
  globalThis.fetch = async (input) => {
    const url = input instanceof Request ? input.url : input.toString()
    requestedHosts.push(new URL(url).host)
    throw new Error('network is disabled in tests')
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

const openaiModel = modelsList.models.find((m) => m.providerId === 'openai')!

const routes = [
  { name: '/api/chat', POST: chat, body: { template: templates } },
  {
    name: '/api/morph-chat',
    POST: morphChat,
    body: { currentFragment: { file_path: 'app.py', code: 'print(1)' } },
  },
]

for (const route of routes) {
  describe(route.name, () => {
    function post(model: unknown, config: object) {
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

    it('returns 400 for a model that is not in models.json', async () => {
      const response = await post(
        { id: 'not-a-model', providerId: 'openai' },
        {},
      )

      assert.equal(response.status, 400)
      assert.deepEqual(requestedHosts, [])
    })

    it('uses the provider from models.json and ignores a client base URL', async () => {
      await post(
        { ...openaiModel, providerId: 'fireworks' },
        { baseURL: 'https://custom-endpoint.example/v1' },
      )

      assert.deepEqual(requestedHosts, ['api.openai.com'])
    })
  })
}
