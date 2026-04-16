import { describe, expect, it } from 'vitest'
import { envSchema } from './env'

const validEnv = {
  E2B_API_KEY: 'test-e2b-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  ZEPL_API_KEY: 'test-zepl-key',
  ZEPL_API_BASE: 'https://api.zepl.io',
  ONSEASON_BASE_URL: 'https://app.onseason.ai',
  ONSEASON_SSO_SECRET: 'a]3Fk9$mP!xL7qR2vN8wT#hY5jB0cD4e',
  NEXT_PUBLIC_ONSEASON_BASE_URL: 'https://app.onseason.ai',
  FLAMINGO_SESSION_SECRET: 'f'.repeat(32),
}

describe('envSchema', () => {
  it('passes with all required vars set', () => {
    const result = envSchema.safeParse(validEnv)
    expect(result.success).toBe(true)
  })

  it('fails when E2B_API_KEY is missing', () => {
    const result = envSchema.safeParse({ ANTHROPIC_API_KEY: 'key' })
    expect(result.success).toBe(false)
  })

  it('fails when ANTHROPIC_API_KEY is missing', () => {
    const result = envSchema.safeParse({ E2B_API_KEY: 'key' })
    expect(result.success).toBe(false)
  })

  it('fails when E2B_API_KEY is empty string', () => {
    const result = envSchema.safeParse({ ...validEnv, E2B_API_KEY: '' })
    expect(result.success).toBe(false)
  })

  it('reports all missing required vars at once', () => {
    const result = envSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('E2B_API_KEY')
      expect(paths).toContain('ANTHROPIC_API_KEY')
      expect(paths).toContain('ZEPL_API_KEY')
      expect(paths).toContain('ZEPL_API_BASE')
      expect(paths).toContain('ONSEASON_BASE_URL')
      expect(paths).toContain('ONSEASON_SSO_SECRET')
      expect(paths).toContain('NEXT_PUBLIC_ONSEASON_BASE_URL')
      expect(paths).toContain('FLAMINGO_SESSION_SECRET')
    }
  })

  it('allows optional vars to be omitted', () => {
    const result = envSchema.safeParse(validEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.OPENAI_API_KEY).toBeUndefined()
      expect(result.data.SENTRY_DSN).toBeUndefined()
    }
  })

  it('treats empty strings as undefined for optional fields', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      SENTRY_DSN: '',
      NEXT_PUBLIC_SITE_URL: '',
      KV_REST_API_URL: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.SENTRY_DSN).toBeUndefined()
      expect(result.data.NEXT_PUBLIC_SITE_URL).toBeUndefined()
      expect(result.data.KV_REST_API_URL).toBeUndefined()
    }
  })

  it('fails when required Onseason SSO vars are empty strings', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      ONSEASON_BASE_URL: '',
      ONSEASON_SSO_SECRET: '',
      NEXT_PUBLIC_ONSEASON_BASE_URL: '',
    })
    expect(result.success).toBe(false)
  })

  it('applies default values for rate limit config', () => {
    const result = envSchema.safeParse(validEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(10)
      expect(result.data.RATE_LIMIT_WINDOW).toBe('24h')
    }
  })

  it('applies defaults when rate limit vars are empty strings', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      RATE_LIMIT_MAX_REQUESTS: '',
      RATE_LIMIT_WINDOW: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(10)
      expect(result.data.RATE_LIMIT_WINDOW).toBe('24h')
    }
  })

  it('coerces RATE_LIMIT_MAX_REQUESTS from string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_MAX_REQUESTS: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(50)
    }
  })

  it('rejects non-integer RATE_LIMIT_MAX_REQUESTS', () => {
    const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_MAX_REQUESTS: '3.14' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid RATE_LIMIT_MAX_REQUESTS (zero)', () => {
    const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_MAX_REQUESTS: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid RATE_LIMIT_WINDOW format', () => {
    expect(envSchema.safeParse({ ...validEnv, RATE_LIMIT_WINDOW: 'banana' }).success).toBe(false)
    expect(envSchema.safeParse({ ...validEnv, RATE_LIMIT_WINDOW: '999x' }).success).toBe(false)
  })

  it('accepts valid RATE_LIMIT_WINDOW durations', () => {
    for (const val of ['500ms', '30s', '5m', '24h', '1d']) {
      const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_WINDOW: val })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid ONSEASON_BASE_URL (not a URL)', () => {
    const result = envSchema.safeParse({ ...validEnv, ONSEASON_BASE_URL: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects ONSEASON_SSO_SECRET shorter than 32 chars', () => {
    const result = envSchema.safeParse({ ...validEnv, ONSEASON_SSO_SECRET: 'short' })
    expect(result.success).toBe(false)
  })

  it('accepts valid optional URL vars', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      SENTRY_DSN: 'https://abc@sentry.io/123',
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('validates LOG_LEVEL enum', () => {
    expect(envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'debug' }).success).toBe(true)
    expect(envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'info' }).success).toBe(true)
    expect(envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'warn' }).success).toBe(true)
    expect(envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'error' }).success).toBe(true)
    expect(envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'verbose' }).success).toBe(false)
  })

  it('treats empty LOG_LEVEL as undefined', () => {
    const result = envSchema.safeParse({ ...validEnv, LOG_LEVEL: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.LOG_LEVEL).toBeUndefined()
    }
  })

  it('passes through optional string vars', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      OPENAI_API_KEY: 'sk-test',
      MORPH_API_KEY: 'morph-test',
      NEXT_PUBLIC_NO_API_KEY_INPUT: 'true',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.OPENAI_API_KEY).toBe('sk-test')
      expect(result.data.MORPH_API_KEY).toBe('morph-test')
      expect(result.data.NEXT_PUBLIC_NO_API_KEY_INPUT).toBe('true')
    }
  })
})
