/**
 * Shared error handling utilities for API routes
 */

export interface APIError {
  statusCode?: number
  message: string
}

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return (
    error &&
    (error.statusCode === 429 ||
      error.message.toLowerCase().includes('limit') ||
      error.message.toLowerCase().includes('billing'))
  )
}

/**
 * Checks if an error is an overloaded/unavailable error
 */
export function isOverloadedError(error: any): boolean {
  return error && (error.statusCode === 529 || error.statusCode === 503)
}

/**
 * Checks if an error is an access denied/unauthorized error
 */
export function isAccessDeniedError(error: any): boolean {
  return error && (error.statusCode === 403 || error.statusCode === 401)
}

/**
 * Handles API errors and returns appropriate Response objects
 */
export function handleAPIError(
  error: any,
  context?: { hasOwnApiKey?: boolean },
): Response {
  // Log the error for debugging
  console.error('API Error:', error)

  if (isRateLimitError(error)) {
    const message = context?.hasOwnApiKey
      ? 'The provider is currently unavailable due to request limit.'
      : 'The provider is currently unavailable due to request limit. Try using your own API key.'

    return new Response(message, { status: 429 })
  }

  if (isOverloadedError(error)) {
    return new Response(
      'The provider is currently unavailable. Please try again later.',
      { status: 529 },
    )
  }

  if (isAccessDeniedError(error)) {
    return new Response(
      'Access denied. Please make sure your API key is valid.',
      { status: 403 },
    )
  }

  // Generic error handling
  return new Response(
    'An unexpected error has occurred. Please try again later.',
    { status: 500 },
  )
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
