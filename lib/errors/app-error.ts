import { z } from 'zod'

/**
 * Error codes — one per failure category, not per subsystem.
 * New codes added as stories are implemented.
 */
export const ErrorCode = {
  // General
  UNKNOWN: 'UNKNOWN',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // Pipeline (added in later stories)
  GENERATION_FAILED: 'GENERATION_FAILED',
  SHADOW_VALIDATION_FAILED: 'SHADOW_VALIDATION_FAILED',
  SANDBOX_TIMEOUT: 'SANDBOX_TIMEOUT',
  SANDBOX_BOOT_FAILED: 'SANDBOX_BOOT_FAILED',
  GIT_COMMIT_FAILED: 'GIT_COMMIT_FAILED',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
  MEMORY_RETRIEVAL_FAILED: 'MEMORY_RETRIEVAL_FAILED',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/** Zod schema for the standard API error response shape */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>

export class AppError extends Error {
  readonly code: ErrorCode
  readonly httpStatus: number
  readonly userMessage: string
  readonly details?: unknown

  constructor(params: {
    code: ErrorCode
    httpStatus: number
    userMessage: string
    message: string
    details?: unknown
    cause?: Error
  }) {
    super(params.message, { cause: params.cause })
    this.name = 'AppError'
    this.code = params.code
    this.httpStatus = params.httpStatus
    this.userMessage = params.userMessage
    this.details = params.details
  }

  /** Factory for wrapping unknown caught values */
  static fromUnknown(error: unknown, fallbackCode: ErrorCode = ErrorCode.UNKNOWN): AppError {
    if (error instanceof AppError) return error

    if (error instanceof Error) {
      return new AppError({
        code: fallbackCode,
        httpStatus: 500,
        userMessage: 'An unexpected error occurred.',
        message: error.message,
        cause: error,
      })
    }

    return new AppError({
      code: fallbackCode,
      httpStatus: 500,
      userMessage: 'An unexpected error occurred.',
      message: typeof error === 'string' ? error : 'Unknown error',
      details: typeof error === 'string' ? undefined : error,
    })
  }

  /** Report to Sentry with structured context */
  async report(extra?: Record<string, unknown>): Promise<void> {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(this, {
        extra: {
          ...extra,
          code: this.code,
          httpStatus: this.httpStatus,
          userMessage: this.userMessage,
        },
      })
    } catch {
      // Sentry not available — silent fallback
    }
  }

  /** Serialize for API error response */
  toResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
      },
    }
  }

  /** Return a Response object for use in API route handlers */
  toHTTPResponse(): Response {
    return new Response(JSON.stringify(this.toResponse()), {
      status: this.httpStatus,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
