'use client'

import { useEffect } from 'react'

/**
 * Login page — immediately redirects to Onseason SSO.
 * The returnTo query param is forwarded so the callback can redirect back.
 */
export default function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const returnTo = params.get('returnTo') || '/'

    const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL
    if (!baseUrl) {
      document.getElementById('login-error')!.textContent =
        'SSO is not configured. Please contact support.'
      return
    }

    const ssoUrl = new URL('/api/sso/authorize', baseUrl)
    ssoUrl.searchParams.set('returnTo', returnTo)

    window.location.href = ssoUrl.toString()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to Onseason...</p>
      <p id="login-error" className="text-destructive mt-2" />
    </div>
  )
}
