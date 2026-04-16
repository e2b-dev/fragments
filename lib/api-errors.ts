/**
 * Shared error handling utilities for API routes
 */

export interface APIError {
  statusCode?: number
  message: string
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('httpStatus' in error) return (error as { httpStatus: number }).httpStatus
    if ('statusCode' in error) return (error as APIError).statusCode
  }
  return undefined
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as APIError).message)
  }
  return 'An unexpected error has occurred.'
}

export function isRateLimitError(error: unknown): boolean {
  const statusCode = getStatusCode(error)
  const message = getMessage(error).toLowerCase()
  return statusCode === 429 || message.includes('limit') || message.includes('billing')
}

export function isOverloadedError(error: unknown): boolean {
  const statusCode = getStatusCode(error)
  return statusCode === 529 || statusCode === 503
}

export function isAccessDeniedError(error: unknown): boolean {
  const statusCode = getStatusCode(error)
  return statusCode === 403 || statusCode === 401
}

export function handleAPIError(error: unknown, context?: { hasOwnApiKey?: boolean }): Response {
  console.error('API Error:', error)

  if (isRateLimitError(error)) {
    const message = context?.hasOwnApiKey
      ? 'The provider is currently unavailable due to request limit.'
      : 'The provider is currently unavailable due to request limit. Try using your own API key.'

    return new Response(message, { status: 429 })
  }

  if (isOverloadedError(error)) {
    return new Response('The provider is currently unavailable. Please try again later.', {
      status: 529,
    })
  }

  if (isAccessDeniedError(error)) {
    return new Response('Access denied. Please make sure your API key is valid.', { status: 403 })
  }

  const message = getMessage(error)
  return new Response(message, { status: 500 })
}

/**
 * Creates rate limit response with headers
 */
export function createRateLimitResponse(limit: {
  amount: number
  remaining: number
  reset: number
}): Response {
  return new Response('You have reached your request limit for the day.', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.amount.toString(),
      'X-RateLimit-Remaining': limit.remaining.toString(),
      'X-RateLimit-Reset': limit.reset.toString(),
    },
  })
}
