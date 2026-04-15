import { logger } from '@/lib/logger'
import { COOKIE_NAME } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Clear the session cookie and redirect to landing page */
export async function GET(request: NextRequest): Promise<Response> {
  logger.info('PM logged out', { pipeline: 'memory-retrieval' })

  const response = NextResponse.redirect(new URL('/', request.url))

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })

  return response
}
