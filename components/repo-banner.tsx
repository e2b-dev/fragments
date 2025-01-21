import { GitHubIcon } from './icons'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { StarFilledIcon } from '@radix-ui/react-icons'

const REPO_URL = 'https://github.com/e2b-dev/fragments'

export function RepoBanner({ className }: { className?: string }) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View Fragments repository on GitHub`}
      className={cn(
        'bg-background overflow-hidden px-3 py-1 rounded-t-2xl',
        'gap-2 flex items-center border border-b-0',
        'transform-y-1 group relative',
        'before:absolute before:inset-0 dark:before:bg-[radial-gradient(circle_at_10%_-50%,rgba(255,255,255,0.1),transparent_10%)] before:rounded-t-2xl before:pointer-events-none',
        className,
      )}
    >
      <GitHubIcon className="w-4 h-4" aria-hidden="true" />
      <Separator
        orientation="vertical"
        className="h-6 bg-[hsl(var(--border))]"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-foreground tracking-wide">
        Star on GitHub
      </p>
      <div
        className="flex items-center gap-1 text-foreground/80"
        role="status"
        aria-live="polite"
      >
        <StarFilledIcon
          className="w-4 h-4 transition-transform group-hover:text-[#e4b340] duration-200 ease-in-out"
          aria-label="GitHub stars"
        />
      </div>
    </a>
  )
}
