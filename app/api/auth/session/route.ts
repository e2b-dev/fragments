import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const result = await getSession(request)

  if (!result.authenticated) {
    return NextResponse.json({ authenticated: false as const })
  }

  // Return session info for client-side use (exclude accessToken)
  const { accessToken, ...publicSession } = result.session

  return NextResponse.json({ authenticated: true as const, session: publicSession })
}
