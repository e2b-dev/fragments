import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { COOKIE_MAX_AGE, COOKIE_NAME, getSessionCookie, signJwt } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  const onseasonBaseUrl = process.env.ONSEASON_BASE_URL
  if (!onseasonBaseUrl) {
    logger.error('ONSEASON_BASE_URL is not configured')
    return NextResponse.json(
      { error: { code: 'CONFIG_INVALID', message: 'Server configuration error' } },
      { status: 500 },
    )
  }

  try {
    const refreshResponse = await fetch(`${onseasonBaseUrl}/api/sso/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: process.env.ONSEASON_SSO_CLIENT_ID ?? 'flamingo' }),
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

    const data = await refreshResponse.json()

    // Update session with fresh data from Onseason
    const updatedSession: PMSession = {
      ...session,
      subscriptionStatus: data.subscription_status ?? session.subscriptionStatus,
      mode: data.mode ?? session.mode,
      accessToken: data.token ?? session.accessToken,
    }

    const newToken = await signJwt(updatedSession, COOKIE_MAX_AGE)

    const response = NextResponse.json({ data: { refreshed: true } })
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
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
