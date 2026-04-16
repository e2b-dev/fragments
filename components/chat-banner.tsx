import { useReducedMotion } from '@/components/motion-provider'
import { getVariant } from '@/lib/chat'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export function ChatBanner({
  message,
  variant = 'error',
  visible,
  onDismiss,
  className,
}: {
  message: string
  variant?: 'error' | 'warning'
  visible: boolean
  onDismiss: () => void
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const bannerVariant = getVariant('chatBanner', prefersReducedMotion)

  const variantStyles =
    variant === 'warning'
      ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
      : 'bg-[var(--error-bg)] text-[var(--error)]'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="chat-banner"
          className={cn(
            'overflow-hidden px-3 py-1.5 rounded-t-2xl',
            'flex items-center gap-2 text-sm font-medium',
            variantStyles,
            className,
          )}
          initial={bannerVariant.initial}
          animate={bannerVariant.animate}
          exit={bannerVariant.exit}
          transition={bannerVariant.transition}
        >
          <span className="flex-1 truncate">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 p-0.5 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
