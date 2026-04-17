'use client'

import { useReducedMotion } from '@/components/motion-provider'
import { Button } from '@/components/ui/button'
import { getVariant } from '@/lib/chat'
import { useUiStore } from '@/stores/use-ui-store'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const MIN_WIDTH_QUERY = '(min-width: 1024px)'

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const isBelowMinWidth = useUiStore((s) => s.isBelowMinWidth)
  const setIsBelowMinWidth = useUiStore((s) => s.setIsBelowMinWidth)
  const [isDismissed, setIsDismissed] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const variants = getVariant('authModal', prefersReducedMotion)

  useEffect(() => {
    const mql = window.matchMedia(MIN_WIDTH_QUERY)
    setIsBelowMinWidth(!mql.matches)

    function handleChange(e: MediaQueryListEvent) {
      setIsBelowMinWidth(!e.matches)
      // Re-show the modal if the user resizes back to a small viewport after dismissing
      if (!e.matches) setIsDismissed(false)
    }

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [setIsBelowMinWidth])

  const showModal = isBelowMinWidth && !isDismissed

  return (
    <>
      {children}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="desktop-gate-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <motion.div
              key="desktop-gate-modal"
              className="relative mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={variants.transition}
            >
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center gap-4 text-center">
                <Image
                  src="/staycy-only-dark.svg"
                  alt="Staycy"
                  width={100}
                  height={14}
                  style={{ width: 100, height: 'auto' }}
                  priority
                />
                <h2 className="font-display text-section font-semibold text-foreground">
                  Works best on a larger screen
                </h2>
                <p className="text-sm text-muted-foreground">
                  For the best experience, open this on a desktop or laptop with a screen width of
                  at least 1024px.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-full rounded-full"
                  onClick={() => setIsDismissed(true)}
                >
                  Continue anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
