import { logger } from '@/lib/logger'
import { COOKIE_NAME } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Clear the session cookie and return success (client handles redirect) */
export async function POST(_request: NextRequest): Promise<Response> {
  logger.info('PM logged out', { pipeline: 'memory-retrieval' })

  const response = NextResponse.json({ data: { loggedOut: true } })

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })

  return response
}
