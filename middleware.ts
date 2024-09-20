import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = req.nextUrl.pathname.split('/').pop()
    const url = await kv.get(`fragment:${id}`)

    if (url) {
      return NextResponse.redirect(url as string)
    } else {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.redirect(new URL('/', req.url))
}

export const config = {
  matcher: '/s/:path*',
}
