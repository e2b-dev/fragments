'use client'

import { Shimmer } from '@/components/ui/shimmer'
import { cn } from '@/lib/utils'

interface CodeShimmerProps {
  code?: string | null
  className?: string
}

export function CodeShimmer({ code, className }: CodeShimmerProps) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {code && (
        <div
          className="absolute inset-0 overflow-hidden px-5 py-4 font-mono text-xs leading-relaxed pointer-events-none select-none"
          style={{ opacity: 0.6 }}
          aria-hidden="true"
        >
          <pre className="whitespace-pre-wrap text-foreground">{code}</pre>
        </div>
      )}
      <Shimmer variant={code ? 'overlay' : 'full'} className="absolute inset-0" />
    </div>
  )
}
