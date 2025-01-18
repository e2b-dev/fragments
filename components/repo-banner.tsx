import { GitHubIcon } from './icons'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { StarFilledIcon } from '@radix-ui/react-icons'

const REPO_URL = 'https://github.com/e2b-dev/fragments'

export function RepoBanner() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View Fragments repository on GitHub`}
      className={cn(
        'bg-background overflow-hidden hover:scale-[1.01] font-light px-3 py-1.5 rounded-2xl',
        'gap-2 w-fit flex items-center shadow-md mt-4 mb-2 ml-2 border',
        'transition-all duration-300 group relative',
        'before:absolute before:w-full before:h-full before:bg-[radial-gradient(circle_at_50%_-50%,rgba(255,255,255,0.1),transparent_70%)] dark:before:bg-[radial-gradient(circle_at_50%_-100%,rgba(255,255,255,0.1),transparent_70%)] before:rounded-2xl before:pointer-events-none',
      )}
    >
      <GitHubIcon className="w-4 h-4" aria-hidden="true" />
      <Separator
        orientation="vertical"
        className="h-6 bg-[hsl(var(--border))]"
        aria-hidden="true"
      />
      <p className="text-sm font-light text-foreground tracking-wide">
        Star on GitHub
      </p>
      <div
        className="flex items-center gap-1 text-foreground/80"
        role="status"
        aria-live="polite"
      >
        <StarFilledIcon
          className="w-4 h-4 transition-transform group-hover:rotate-[90deg] duration-300 ease-in-out"
          aria-label="GitHub stars"
        />
      </div>
    </a>
  )
}
