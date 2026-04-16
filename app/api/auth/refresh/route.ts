import { env } from '@/lib/env'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { COOKIE_NAME, getSessionCookie, signJwt } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

/** Schema for Onseason /api/sso/refresh response */
const refreshResponseSchema = z.object({
  token: z.string(),
  expires_in: z.number(),
  subscription_status: z.enum(['active', 'inactive']),
  mode: z.enum(['active', 'preview']),
})

/**
 * Token refresh endpoint.
 * Calls Onseason /api/sso/refresh to get fresh subscription status,
 * then re-signs the Flamingo JWT cookie.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const cookieData = await getSessionCookie(request)
  if (!cookieData) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'No valid session' } },
      { status: 401 },
    )
  }

  const { session } = cookieData

  try {
    const refreshResponse = await fetch(`${env.ONSEASON_BASE_URL}/api/sso/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: env.ONSEASON_SSO_CLIENT_ID }),
    })

    if (!refreshResponse.ok) {
      logger.warn('Token refresh failed — PM may have lost Onseason access', {
        pipeline: 'memory-retrieval',
        pmId: session.pmId,
      })

      // Clear cookie on 401 — PM lost Onseason access
      if (refreshResponse.status === 401) {
        const response = NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
          { status: 401 },
        )
        response.cookies.set(COOKIE_NAME, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        })
        return response
      }

      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Refresh failed' } },
        { status: 401 },
      )
    }

    const data = refreshResponseSchema.parse(await refreshResponse.json())

    // Update session with fresh data from Onseason
    const updatedSession: PMSession = {
      ...session,
      subscriptionStatus: data.subscription_status,
      mode: data.mode,
      accessToken: data.token,
    }

    const newToken = await signJwt(updatedSession, data.expires_in)

    const response = NextResponse.json({ data: { refreshed: true } })
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: data.expires_in,
      path: '/',
    })

    logger.info('Token refreshed successfully', {
      pipeline: 'memory-retrieval',
      pmId: session.pmId,
    })

    return response
  } catch (error: unknown) {
    const appError = AppError.fromUnknown(error)
    logger.error('Token refresh error', {
      pipeline: 'memory-retrieval',
      pmId: session.pmId,
    })
    await appError.report()
    return NextResponse.json(
      { error: { code: 'UNKNOWN', message: 'Refresh failed' } },
      { status: 500 },
    )
  }
}
