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
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AppError) {
      return error.toHTTPResponse()
    }
    const appError = AppError.fromUnknown(error)
    return appError.toHTTPResponse()
  }
}
