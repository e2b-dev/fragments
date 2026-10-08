import { POST as chat } from './chat/route'
import { POST as morphChat } from './morph-chat/route'
import modelsList from '@/lib/models.json'
import templates from '@/lib/templates'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

const kvHost = 'kv.test'

const originalFetch = globalThis.fetch
let requestedHosts: string[] = []
let requestedBodies: string[] = []
let rateLimitChecked = false

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.FIREWORKS_API_KEY = 'test-key'
  process.env.GOOGLE_VERTEX_PROJECT = 'test-project'
  process.env.GOOGLE_VERTEX_LOCATION = 'us-central1'
  process.env.KV_REST_API_URL = `https://${kvHost}`
  process.env.KV_REST_API_TOKEN = 'test-token'
  requestedHosts = []
  requestedBodies = []
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
    requestedBodies.push(String(init?.body))
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
  { name: '/api/chat', POST: chat },
  { name: '/api/morph-chat', POST: morphChat },
]

type Route = (typeof routes)[number]

// The shape the page sends, including an image and an earlier answer.
function validBody(route: Route, providerId = 'openai'): any {
  const model = firstModelOf(providerId)
  return {
    userID: 'user-id',
    teamID: 'team-id',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Build a counter app' },
          { type: 'image', image: 'data:image/png;base64,iVBORw0KGgo=' },
        ],
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'A counter app' },
          { type: 'text', text: 'print(1)' },
        ],
      },
      { role: 'user', content: [{ type: 'text', text: 'Make it blue' }] },
    ],
    template: templates,
    model,
    config: { model: model.id, temperature: 0.5, maxTokens: 1000 },
    ...(route.name === '/api/morph-chat'
      ? {
          currentFragment: {
            title: 'Counter',
            file_path: 'app.py',
            code: 'print(1)',
          },
        }
      : {}),
  }
}

function post(route: Route, body: unknown) {
  return route.POST(
    new Request(`http://localhost${route.name}`, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

const invalidRequests: [string, (body: any) => unknown][] = [
  ['malformed JSON', () => '{'],
  ['an unknown top-level field', (body) => ({ ...body, extra: true })],
  ['no messages', (body) => ({ ...body, messages: [] })],
  [
    'a system message',
    (body) => ({
      ...body,
      messages: [{ role: 'system', content: [{ type: 'text', text: 'x' }] }],
    }),
  ],
  [
    'an image URL',
    (body) => ({
      ...body,
      messages: [
        {
          role: 'user',
          content: [{ type: 'image', image: 'https://example.com/a.png' }],
        },
      ],
    }),
  ],
  [
    'an image in an assistant message',
    (body) => ({
      ...body,
      messages: [
        {
          role: 'assistant',
          content: [{ type: 'image', image: 'data:image/png;base64,AAAA' }],
        },
      ],
    }),
  ],
  [
    'an unknown message field',
    (body) => ({
      ...body,
      messages: [{ ...body.messages[2], experimental_attachments: [] }],
    }),
  ],
  ['no templates', (body) => ({ ...body, template: {} })],
  ['an unknown template', (body) => ({ ...body, template: { other: {} } })],
  [
    'an unknown model',
    (body) => ({ ...body, model: { ...body.model, id: 'x' } }),
  ],
  [
    'a mismatched provider',
    (body) => ({ ...body, model: { ...body.model, providerId: 'fireworks' } }),
  ],
  [
    'an unknown model field',
    (body) => ({
      ...body,
      model: { ...body.model, baseURL: 'https://x.test' },
    }),
  ],
  ...['baseURL', 'headers', 'maxRetries'].map(
    (key): [string, (body: any) => unknown] => [
      `config.${key}`,
      (body) => ({ ...body, config: { ...body.config, [key]: 'x' } }),
    ],
  ),
  ...['', '  ', 123, null, {}].map(
    (apiKey): [string, (body: any) => unknown] => [
      `the API key ${JSON.stringify(apiKey)}`,
      (body) => ({ ...body, config: { ...body.config, apiKey } }),
    ],
  ),
  ...[{ maxTokens: 0 }, { maxTokens: 1.5 }, { maxTokens: 100000 }].map(
    (params): [string, (body: any) => unknown] => [
      `the parameters ${JSON.stringify(params)}`,
      (body) => ({ ...body, config: { ...body.config, ...params } }),
    ],
  ),
  [
    'a non-numeric temperature',
    (body) => ({ ...body, config: { ...body.config, temperature: '1' } }),
  ],
]

for (const route of routes) {
  describe(route.name, () => {
    it('accepts the request the page sends', async () => {
      await post(route, validBody(route))

      assert.equal(rateLimitChecked, true)
      assert.deepEqual(requestedHosts, ['api.openai.com'])
    })

    for (const [name, change] of invalidRequests) {
      it(`returns 400 for ${name}`, async () => {
        const response = await post(route, change(validBody(route)))

        assert.equal(response.status, 400)
        assert.equal(rateLimitChecked, false)
        assert.deepEqual(requestedHosts, [])
      })
    }

    it('rate limits vertex requests even with a caller key', async () => {
      const body = validBody(route, 'vertex')
      await post(route, { ...body, config: { ...body.config, apiKey: 'key' } })

      assert.equal(rateLimitChecked, true)
    })
  })
}

describe('/api/chat', () => {
  it('builds the prompt from the server templates', async () => {
    const id = 'code-interpreter-v1'
    const body = validBody(routes[0])
    await post(routes[0], {
      ...body,
      template: { [id]: { instructions: 'Client instructions' } },
    })

    assert.ok(requestedBodies[0].includes(templates[id].instructions))
    assert.ok(!requestedBodies[0].includes('Client instructions'))
  })

  it('skips the rate limit with a caller key', async () => {
    const body = validBody(routes[0])
    await post(routes[0], {
      ...body,
      config: { ...body.config, apiKey: 'user-key' },
    })

    assert.equal(rateLimitChecked, false)
    assert.deepEqual(requestedHosts, ['api.openai.com'])
  })
})

describe('/api/morph-chat', () => {
  it('still rate limits with a caller key, because Morph Apply uses the server key', async () => {
    const body = validBody(routes[1])
    await post(routes[1], {
      ...body,
      config: { ...body.config, apiKey: 'user-key' },
    })

    assert.equal(rateLimitChecked, true)
  })

  it('returns 400 without the current file', async () => {
    const body = validBody(routes[1])
    for (const currentFragment of [undefined, { file_path: 'app.py' }]) {
      const response = await post(routes[1], { ...body, currentFragment })

      assert.equal(response.status, 400)
    }
    assert.deepEqual(requestedHosts, [])
  })
})
