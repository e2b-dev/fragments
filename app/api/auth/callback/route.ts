import { env } from '@/lib/env'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { setSessionCookie } from '@/lib/session'
import type { PMSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

/** Schema for Onseason /api/sso/token response */
const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.literal('Bearer'),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    subscription_status: z.enum(['active', 'inactive']),
    mode: z.enum(['active', 'preview']),
    subdomain: z.string().nullable(),
    custom_domain: z.string().nullable(),
    tenant_id: z.string().nullable(),
    currency: z.string(),
  }),
})

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get('code')
  const rawReturnTo = request.nextUrl.searchParams.get('returnTo') || '/'
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/'

  if (!code) {
    logger.warn('SSO callback missing code parameter')
    return NextResponse.redirect(new URL('/?error=missing_code', request.url))
  }

  try {
    // Exchange authorization code for access token (server-to-server)
    const tokenResponse = await fetch(`${env.ONSEASON_BASE_URL}/api/sso/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.ONSEASON_SSO_CLIENT_ID,
        client_secret: env.ONSEASON_SSO_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json().catch(() => ({ error: 'unknown' }))
      logger.warn('SSO code exchange failed', { status: tokenResponse.status })
      const errorMsg = typeof errorBody.error === 'string' ? errorBody.error : 'exchange_failed'
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorMsg)}`, request.url))
    }

    const rawData = await tokenResponse.json()
    const parseResult = tokenResponseSchema.safeParse(rawData)

    if (!parseResult.success) {
      logger.error('Token response failed schema validation')
      return NextResponse.redirect(new URL('/?error=invalid_response', request.url))
    }

    const data = parseResult.data

    const session: PMSession = {
      pmId: data.user.id,
      workspaceId: data.workspace.id,
      email: data.user.email,
      name: data.user.name ?? '',
      image: data.user.image ?? null,
      subscriptionStatus: data.workspace.subscription_status,
      mode: data.workspace.mode,
      subdomain: data.workspace.subdomain ?? null,
      customDomain: data.workspace.custom_domain ?? null,
      tenantId: data.workspace.tenant_id ?? null,
      currency: data.workspace.currency,
      impersonatedBy: null,
      accessToken: data.access_token,
    }

    const redirectUrl = new URL(returnTo, request.url)
    const response = NextResponse.redirect(redirectUrl)
    await setSessionCookie(response, session)

    logger.info('SSO login successful', { pmId: session.pmId })
    return response
  } catch (error: unknown) {
    const appError = AppError.fromUnknown(error)
    logger.error('SSO callback error')
    await appError.report()
    return NextResponse.redirect(new URL('/?error=server_error', request.url))
  }
}
