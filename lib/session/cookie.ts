import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { signJwt, verifyJwt } from './jwt'
import type { PMSession } from './types'

export const COOKIE_NAME = 'flamingo_session'
export const COOKIE_MAX_AGE = 60 * 60 // 1 hour

/** Set the session cookie on a response */
export async function setSessionCookie(response: NextResponse, session: PMSession): Promise<void> {
  const token = await signJwt(session, COOKIE_MAX_AGE)

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/** Read and validate the session cookie from a request */
export async function getSessionCookie(
  request: NextRequest,
): Promise<{ session: PMSession; expiresAt: number; rawToken: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null

  const result = await verifyJwt(token)
  if (!result.valid) return null

  return { session: result.session, expiresAt: result.expiresAt, rawToken: token }
}

/** Clear the session cookie on a response */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}
