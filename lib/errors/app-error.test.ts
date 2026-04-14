import { describe, expect, it, vi } from 'vitest'
import { ApiErrorResponseSchema, AppError, ErrorCode } from './app-error'

describe('ErrorCode', () => {
  it('contains expected general error codes', () => {
    expect(ErrorCode.UNKNOWN).toBe('UNKNOWN')
    expect(ErrorCode.VALIDATION).toBe('VALIDATION')
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED')
    expect(ErrorCode.CONFIG_INVALID).toBe('CONFIG_INVALID')
  })

  it('contains expected pipeline error codes', () => {
    expect(ErrorCode.GENERATION_FAILED).toBe('GENERATION_FAILED')
    expect(ErrorCode.SANDBOX_TIMEOUT).toBe('SANDBOX_TIMEOUT')
    expect(ErrorCode.GIT_COMMIT_FAILED).toBe('GIT_COMMIT_FAILED')
    expect(ErrorCode.PUBLISH_FAILED).toBe('PUBLISH_FAILED')
    expect(ErrorCode.MEMORY_RETRIEVAL_FAILED).toBe('MEMORY_RETRIEVAL_FAILED')
  })
})

describe('AppError', () => {
  it('constructs with all required fields', () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION,
      httpStatus: 400,
      userMessage: 'Invalid input.',
      message: 'Validation failed: name is required',
    })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('AppError')
    expect(error.code).toBe('VALIDATION')
    expect(error.httpStatus).toBe(400)
    expect(error.userMessage).toBe('Invalid input.')
    expect(error.message).toBe('Validation failed: name is required')
    expect(error.details).toBeUndefined()
  })

  it('constructs with optional details and cause', () => {
    const cause = new Error('original')
    const error = new AppError({
      code: ErrorCode.UNKNOWN,
      httpStatus: 500,
      userMessage: 'Something went wrong.',
      message: 'Internal failure',
      details: { requestId: 'abc-123' },
      cause,
    })

    expect(error.details).toEqual({ requestId: 'abc-123' })
    expect(error.cause).toBe(cause)
  })

  describe('fromUnknown', () => {
    it('returns the same AppError if already an AppError', () => {
      const original = new AppError({
        code: ErrorCode.NOT_FOUND,
        httpStatus: 404,
        userMessage: 'Not found.',
        message: 'Resource not found',
      })

      const result = AppError.fromUnknown(original)
      expect(result).toBe(original)
    })

    it('wraps a standard Error', () => {
      const original = new Error('Something broke')
      const result = AppError.fromUnknown(original)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe('UNKNOWN')
      expect(result.httpStatus).toBe(500)
      expect(result.message).toBe('Something broke')
      expect(result.userMessage).toBe('An unexpected error occurred.')
      expect(result.cause).toBe(original)
    })

    it('wraps a standard Error with custom fallback code', () => {
      const result = AppError.fromUnknown(new Error('timeout'), ErrorCode.SANDBOX_TIMEOUT)
      expect(result.code).toBe('SANDBOX_TIMEOUT')
    })

    it('wraps a string error', () => {
      const result = AppError.fromUnknown('string error')

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe('UNKNOWN')
      expect(result.message).toBe('string error')
      expect(result.details).toBeUndefined()
    })

    it('wraps an unknown non-string, non-Error value', () => {
      const result = AppError.fromUnknown({ foo: 'bar' })

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe('UNKNOWN')
      expect(result.message).toBe('Unknown error')
      expect(result.details).toEqual({ foo: 'bar' })
    })

    it('wraps null', () => {
      const result = AppError.fromUnknown(null)
      expect(result).toBeInstanceOf(AppError)
      expect(result.message).toBe('Unknown error')
    })

    it('wraps undefined', () => {
      const result = AppError.fromUnknown(undefined)
      expect(result).toBeInstanceOf(AppError)
      expect(result.message).toBe('Unknown error')
    })
  })

  describe('toResponse', () => {
    it('serializes to the standard API error shape', () => {
      const error = new AppError({
        code: ErrorCode.FORBIDDEN,
        httpStatus: 403,
        userMessage: 'Access denied.',
        message: 'User lacks permission for resource X',
      })

      const response = error.toResponse()
      expect(response).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied.',
        },
      })
    })

    it('does not leak internal message in response', () => {
      const error = new AppError({
        code: ErrorCode.UNKNOWN,
        httpStatus: 500,
        userMessage: 'Something went wrong.',
        message: 'SQL injection attempt detected in column xyz',
      })

      const response = error.toResponse()
      expect(response.error.message).toBe('Something went wrong.')
      expect(JSON.stringify(response)).not.toContain('SQL injection')
    })
  })

  describe('toHTTPResponse', () => {
    it('returns a Response with correct status and JSON body', async () => {
      const error = new AppError({
        code: ErrorCode.NOT_FOUND,
        httpStatus: 404,
        userMessage: 'Not found.',
        message: 'Resource missing',
      })

      const response = error.toHTTPResponse()
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(404)
      expect(response.headers.get('Content-Type')).toBe('application/json')

      const body = await response.json()
      expect(body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Not found.',
        },
      })
    })
  })

  describe('report', () => {
    it('calls Sentry.captureException with structured context', async () => {
      const captureException = vi.fn()
      vi.doMock('@sentry/nextjs', () => ({ captureException }))

      const error = new AppError({
        code: ErrorCode.GENERATION_FAILED,
        httpStatus: 500,
        userMessage: 'Generation failed.',
        message: 'Claude returned invalid JSON',
      })

      await error.report({ sandboxId: 'sb-123' })

      expect(captureException).toHaveBeenCalledWith(error, {
        extra: {
          sandboxId: 'sb-123',
          code: 'GENERATION_FAILED',
          httpStatus: 500,
          userMessage: 'Generation failed.',
        },
      })

      vi.doUnmock('@sentry/nextjs')
    })
  })
})

describe('ApiErrorResponseSchema', () => {
  it('validates a correct error response', () => {
    const valid = { error: { code: 'NOT_FOUND', message: 'Not found.' } }
    const result = ApiErrorResponseSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects response missing error.code', () => {
    const invalid = { error: { message: 'Not found.' } }
    const result = ApiErrorResponseSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects response missing error.message', () => {
    const invalid = { error: { code: 'NOT_FOUND' } }
    const result = ApiErrorResponseSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects empty object', () => {
    const result = ApiErrorResponseSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
