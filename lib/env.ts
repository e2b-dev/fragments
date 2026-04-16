import { z } from 'zod'

/** Convert empty strings to undefined so .optional() and .default() work with .env files */
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema)

export const envSchema = z.object({
  // Required — fail fast if missing
  E2B_API_KEY: emptyToUndefined(z.string().min(1)),
  ANTHROPIC_API_KEY: emptyToUndefined(z.string().min(1)),

  // Required for rate limiting (currently used in ratelimit.ts)
  KV_REST_API_URL: emptyToUndefined(z.string().url().optional()),
  KV_REST_API_TOKEN: emptyToUndefined(z.string().optional()),

  // Optional AI providers
  OPENAI_API_KEY: emptyToUndefined(z.string().optional()),
  GROQ_API_KEY: emptyToUndefined(z.string().optional()),
  FIREWORKS_API_KEY: emptyToUndefined(z.string().optional()),
  TOGETHER_API_KEY: emptyToUndefined(z.string().optional()),
  GOOGLE_AI_API_KEY: emptyToUndefined(z.string().optional()),
  GOOGLE_VERTEX_CREDENTIALS: emptyToUndefined(z.string().optional()),
  MISTRAL_API_KEY: emptyToUndefined(z.string().optional()),
  XAI_API_KEY: emptyToUndefined(z.string().optional()),
  MORPH_API_KEY: emptyToUndefined(z.string().optional()),

  // ZEPL API (shared credentials — same for all PMs)
  ZEPL_API_KEY: emptyToUndefined(z.string().min(1)),
  ZEPL_API_BASE: emptyToUndefined(z.string().url()),

  // Onseason SSO
  ONSEASON_BASE_URL: emptyToUndefined(z.string().url()),
  ONSEASON_SSO_SECRET: emptyToUndefined(z.string().min(32)), // Shared with Onseason product registry
  ONSEASON_SSO_CLIENT_ID: emptyToUndefined(z.string().min(1).default('flamingo')),
  NEXT_PUBLIC_ONSEASON_BASE_URL: emptyToUndefined(z.string().url()),
  NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID: emptyToUndefined(z.string().min(1).default('flamingo')),

  // Flamingo session signing (separate from Onseason SSO secret)
  FLAMINGO_SESSION_SECRET: emptyToUndefined(z.string().min(32)),

  // Sentry (optional — dev environments may not have it)
  SENTRY_DSN: emptyToUndefined(z.string().url().optional()),
  SENTRY_AUTH_TOKEN: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_SENTRY_DSN: emptyToUndefined(z.string().url().optional()),

  // Public vars
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(z.string().url().optional()),
  NEXT_PUBLIC_POSTHOG_KEY: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_POSTHOG_HOST: emptyToUndefined(z.string().optional()),

  // Rate limit config
  RATE_LIMIT_MAX_REQUESTS: emptyToUndefined(
    z.coerce.number().int().positive().optional().default(10),
  ),
  RATE_LIMIT_WINDOW: emptyToUndefined(
    z
      .string()
      .regex(/^\d+\s?(ms|s|m|h|d)$/)
      .optional()
      .default('24h'),
  ),

  // Logging
  LOG_LEVEL: emptyToUndefined(z.enum(['debug', 'info', 'warn', 'error']).optional()),

  // Feature flags
  NEXT_PUBLIC_NO_API_KEY_INPUT: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_NO_BASE_URL_INPUT: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_HIDE_LOCAL_MODELS: emptyToUndefined(z.string().optional()),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | undefined

/** Lazy-validated env — validates on first access, not at import time */
export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env)
  }
  return _env
}

/** Proxy that lazily validates env on first property access */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env]
  },
})
