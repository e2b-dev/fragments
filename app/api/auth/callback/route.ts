import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { setSessionCookie } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

/** Schema for Onseason /api/sso/token response */
const onseasonTokenResponseSchema = z.object({
  valid: z.literal(true),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  workspace: z.object({
    id: z.string(),
    subscription_status: z.enum(['active', 'inactive']),
    mode: z.enum(['active', 'preview']),
  }),
})

/**
 * Server-side SSO callback handler.
 * Receives the token from Onseason's redirect, validates it server-to-server,
 * sets the Flamingo JWT cookie, and redirects to the builder.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get('token')
  const rawReturnTo = request.nextUrl.searchParams.get('returnTo') || '/'
  // Prevent open redirect — only allow relative paths
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/'

  if (!token) {
    logger.warn('SSO callback missing token parameter')
    return NextResponse.redirect(new URL('/callback?error=missing_token', request.url))
  }

  const onseasonBaseUrl = process.env.ONSEASON_BASE_URL
  if (!onseasonBaseUrl) {
    logger.error('ONSEASON_BASE_URL is not configured')
    return NextResponse.redirect(new URL('/callback?error=config_error', request.url))
  }

  try {
    // Server-to-server token validation with Onseason
    const validateResponse = await fetch(`${onseasonBaseUrl}/api/sso/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!validateResponse.ok) {
      const errorBody = await validateResponse.json().catch(() => ({ error: 'unknown' }))
      logger.warn('SSO token validation failed', {
        pipeline: 'memory-retrieval',
        pmId: 'unknown',
      })
      const errorMsg = typeof errorBody.error === 'string' ? errorBody.error : 'token_invalid'
      return NextResponse.redirect(
        new URL(`/callback?error=${encodeURIComponent(errorMsg)}`, request.url),
      )
    }

    const rawData = await validateResponse.json()
    const parseResult = onseasonTokenResponseSchema.safeParse(rawData)

    if (!parseResult.success) {
      logger.error('Onseason token response failed schema validation', {
        pipeline: 'memory-retrieval',
        pmId: 'unknown',
      })
      return NextResponse.redirect(new URL('/callback?error=invalid_response', request.url))
    }

    const data = parseResult.data

    const session: PMSession = {
      pmId: data.user.id,
      workspaceId: data.workspace.id,
      email: data.user.email,
      name: data.user.name,
      image: null, // Populated after Task 18 code exchange
      subscriptionStatus: data.workspace.subscription_status,
      mode: data.workspace.mode,
      subdomain: null, // Populated from userinfo in Story 1.4
      customDomain: null, // Populated after Task 18 code exchange
      tenantId: null, // Populated from userinfo in Story 1.4
      currency: 'EUR', // Default, updated from userinfo in Story 1.4
      impersonatedBy: null, // Populated after Task 18 code exchange
      accessToken: '', // Populated after Task 18 code exchange
    }

    // Redirect to the returnTo URL with the session cookie
    const redirectUrl = new URL(returnTo, request.url)
    const response = NextResponse.redirect(redirectUrl)

    await setSessionCookie(response, session)

    logger.info('SSO login successful', {
      pipeline: 'memory-retrieval',
      pmId: session.pmId,
    })

    return response
  } catch (error: unknown) {
    const appError = AppError.fromUnknown(error)
    logger.error('SSO callback error', {
      pipeline: 'memory-retrieval',
      pmId: 'unknown',
    })
    await appError.report()
    return NextResponse.redirect(new URL('/callback?error=server_error', request.url))
  }
}
