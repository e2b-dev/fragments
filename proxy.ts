import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { clearSessionCookie, getSessionCookie, setSessionCookie } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

/** Public routes that do NOT require auth */
const PUBLIC_ROUTES = [
  '/', // Landing page
  '/api/auth/callback', // SSO callback
  '/api/auth/logout', // Logout endpoint
  '/api/auth/session', // Session check (used by landing page)
]

/** Schema for Onseason /api/sso/refresh response */
const refreshResponseSchema = z.object({
  token: z.string(),
  expires_in: z.number(),
  subscription_status: z.enum(['active', 'inactive']),
  mode: z.enum(['active', 'preview']),
})

/** Seconds remaining before we trigger a proactive refresh (30 min) */
const REFRESH_THRESHOLD_SECONDS = 30 * 60

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fragment URL redirects (existing logic — /s/:path*)
  if (pathname.startsWith('/s/')) {
    return handleFragmentRedirect(request)
  }

  // Allow static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return NextResponse.next()
  }

  // Validate JWT cookie for all other routes
  // Proxy only gates (allow/deny) — does NOT inject session into headers.
  // API routes call requireAuth(request) to parse the cookie themselves.
  const cookieData = await getSessionCookie(request)

  if (!cookieData) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }
    // Page routes redirect to Onseason SSO
    const loginUrl = new URL(`${env.NEXT_PUBLIC_ONSEASON_BASE_URL}/api/sso/authorize`)
    loginUrl.searchParams.set('client_id', env.ONSEASON_SSO_CLIENT_ID)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Proactive refresh: if cookie has < 30 min remaining, refresh in-band
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = cookieData.expiresAt - now

  if (timeRemaining < REFRESH_THRESHOLD_SECONDS) {
    const refreshResult = await refreshSession(cookieData.session)
    if (!refreshResult) {
      // PM lost Onseason access — invalidate immediately
      logger.warn('Proactive refresh failed — clearing session', {
        pipeline: 'memory-retrieval',
        pmId: cookieData.session.pmId,
      })

      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
          { status: 401 },
        )
        clearSessionCookie(response)
        return response
      }

      const loginUrl = new URL(`${env.NEXT_PUBLIC_ONSEASON_BASE_URL}/api/sso/authorize`)
      loginUrl.searchParams.set('client_id', env.ONSEASON_SSO_CLIENT_ID)
      loginUrl.searchParams.set('returnTo', pathname)
      const response = NextResponse.redirect(loginUrl)
      clearSessionCookie(response)
      return response
    }

    // Re-sign cookie with fresh data and continue
    const response = NextResponse.next()
    await setSessionCookie(response, refreshResult.session, refreshResult.expiresIn)
    return response
  }

  return NextResponse.next()
}

/** Existing fragment URL redirect logic */
async function handleFragmentRedirect(req: NextRequest) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = req.nextUrl.pathname.split('/').pop()
    const url = await kv.get(`fragment:${id}`)

    if (url) {
      return NextResponse.redirect(url as string)
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.redirect(new URL('/', req.url))
}

/** Attempt to refresh the session via Onseason */
async function refreshSession(
  session: PMSession,
): Promise<{ session: PMSession; expiresIn: number } | null> {
  try {
    const response = await fetch(`${env.ONSEASON_BASE_URL}/api/sso/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ client_id: env.ONSEASON_SSO_CLIENT_ID }),
    })

    if (!response.ok) return null
    const data = refreshResponseSchema.parse(await response.json())

    return {
      session: {
        ...session,
        subscriptionStatus: data.subscription_status,
        mode: data.mode,
        accessToken: data.token,
      },
      expiresIn: data.expires_in,
    }
  } catch {
    return null
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
