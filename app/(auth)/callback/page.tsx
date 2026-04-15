'use client'

import { useEffect, useState } from 'react'

/**
 * Client-side callback display — shows loading state while
 * the server-side /api/auth/callback handles the actual SSO exchange.
 * This page exists only as a fallback display if the user lands here directly.
 */
export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam) {
      setError(errorParam)
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">Authentication failed</p>
          <p className="text-muted-foreground text-sm mt-2">{error}</p>
          <a href="/login" className="text-primary underline text-sm mt-4 inline-block">
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  )
}
