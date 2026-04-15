import type { NextRequest } from 'next/server'
import { COOKIE_NAME } from './cookie'
import { verifyJwt } from './jwt'
import type { AuthResult } from './types'

/** Extract and validate the PM session from a request's cookie */
export async function getSession(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return { authenticated: false, reason: 'no_cookie' }
  }

  const result = await verifyJwt(token)

  if (!result.valid) {
    return { authenticated: false, reason: result.reason }
  }

  return { authenticated: true, session: result.session }
}
