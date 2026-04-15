import { logger } from '@/lib/logger'
import { clearSessionCookie, getSessionCookie, setSessionCookie } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Public routes that do NOT require auth */
const PUBLIC_ROUTES = [
  '/', // Landing page
  '/login', // Login redirect page
  '/api/auth/callback', // SSO callback
  '/api/auth/logout', // Logout endpoint
  '/callback', // SSO error display page
]

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
    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Proactive refresh: if cookie has < 30 min remaining, refresh in-band
  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = cookieData.expiresAt - now

  if (timeRemaining < REFRESH_THRESHOLD_SECONDS) {
    const refreshed = await refreshSession(cookieData.session, cookieData.rawToken)
    if (!refreshed) {
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

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      const response = NextResponse.redirect(loginUrl)
      clearSessionCookie(response)
      return response
    }

    // Re-sign cookie with fresh data and continue
    const response = NextResponse.next()
    await setSessionCookie(response, refreshed)
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
async function refreshSession(session: PMSession, rawToken: string): Promise<PMSession | null> {
  const onseasonBaseUrl = process.env.ONSEASON_BASE_URL
  if (!onseasonBaseUrl) return null

  try {
    const response = await fetch(`${onseasonBaseUrl}/api/sso/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      ...session,
      subscriptionStatus: data.subscription_status ?? session.subscriptionStatus,
      mode: data.mode ?? session.mode,
    }
  } catch {
    return null
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
