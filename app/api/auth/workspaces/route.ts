import { env } from '@/lib/env'
import { AppError } from '@/lib/errors'
import { requireAuth } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const response = await fetch(
      `${env.ONSEASON_BASE_URL}/api/sso/workspaces?client_id=${env.ONSEASON_SSO_CLIENT_ID}`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      },
    )

    if (!response.ok) {
      return NextResponse.json({ workspaces: [] })
    }

    const data = await response.json()
    // Map snake_case API response to camelCase for client
    const workspaces = (data.workspaces ?? []).map(
      (ws: {
        id: string
        name: string
        slug: string
        role: string
        logo_url?: string | null
        subscription_status: string
        mode: string
      }) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: ws.role,
        logoUrl: ws.logo_url ?? null,
        subscriptionStatus: ws.subscription_status,
        mode: ws.mode,
      }),
    )
    return NextResponse.json({ workspaces })
  } catch (error) {
    if (error instanceof AppError) {
      return error.toHTTPResponse()
    }
    const appError = AppError.fromUnknown(error)
    return appError.toHTTPResponse()
  }
}
