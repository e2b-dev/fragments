import { toRequestConfig } from './request-schema'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

describe('toRequestConfig', () => {
  it('drops settings the chat API does not accept', () => {
    const saved = {
      model: 'gpt-5',
      apiKey: 'user-key',
      baseURL: 'https://old-endpoint.example/v1',
      temperature: 0.5,
    }

    assert.deepEqual(toRequestConfig(saved), {
      model: 'gpt-5',
      apiKey: 'user-key',
      temperature: 0.5,
    })
  })
})
