import { AppError, ErrorCode } from '@/lib/errors'
import type { NextRequest } from 'next/server'
import { getSession } from './auth'
import type { PMSession } from './types'

/**
 * Require authenticated session for API routes.
 * Throws AppError with 401 if session is invalid or missing.
 */
export async function requireAuth(request: NextRequest): Promise<PMSession> {
  const result = await getSession(request)

  if (!result.authenticated) {
    throw new AppError({
      code: ErrorCode.UNAUTHORIZED,
      httpStatus: 401,
      userMessage: 'Authentication required. Please sign in.',
      message: `Auth failed: ${result.reason}`,
    })
  }

  return result.session
}
