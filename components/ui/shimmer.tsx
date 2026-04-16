'use client'

import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
  variant?: 'full' | 'overlay'
}

export function Shimmer({ className, variant = 'full' }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r bg-[length:200%_100%]',
        variant === 'full'
          ? 'from-[var(--preview-shimmer-from,#F0EDE7)] via-[var(--preview-shimmer-to,#F8F6F2)] to-[var(--preview-shimmer-from,#F0EDE7)]'
          : 'from-[var(--preview-shimmer-from,#F0EDE7)]/80 via-[var(--preview-shimmer-to,#F8F6F2)]/80 to-[var(--preview-shimmer-from,#F0EDE7)]/80',
        'motion-reduce:animate-none motion-reduce:bg-[var(--preview-shimmer-from,#F0EDE7)]',
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
