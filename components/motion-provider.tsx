'use client'

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

const ReducedMotionContext = createContext(false)

export function MotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return <ReducedMotionContext value={prefersReducedMotion}>{children}</ReducedMotionContext>
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}
