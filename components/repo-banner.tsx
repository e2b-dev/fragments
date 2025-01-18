import { GitHubIcon } from './icons'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { StarFilledIcon } from '@radix-ui/react-icons'

const REPO_URL = 'https://github.com/e2b-dev/fragments'
const REPO_DATA_URL = 'https://api.github.com/repos/e2b-dev/fragments'

// Refetch GitHub Repo Data every hour
export const revalidate = 60 * 60

export async function RepoBanner() {
  const repoData: {
    stargazers_count: number
  } = await fetch(REPO_DATA_URL).then((res) => res.json())

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View Fragments repository on GitHub - ${repoData.stargazers_count} stars`}
      className={cn(
        'bg-background overflow-hidden hover:scale-[1.01] font-light px-3 py-1.5 rounded-2xl',
        'gap-2 w-fit flex items-center shadow-md mt-auto mb-2 ml-2 border',
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
      <p className="text-sm font-light text-muted-foreground tracking-wide">
        Star on GitHub
      </p>
      <div
        className="flex items-center gap-1 text-foreground/80"
        role="status"
        aria-live="polite"
      >
        <StarFilledIcon
          className="w-4 h-4 transition-transform group-hover:rotate-[360deg] duration-300 ease-in-out"
          aria-label="GitHub stars"
        />
        <span className="text-sm">
          {repoData.stargazers_count.toLocaleString()}
        </span>
      </div>
    </a>
  )
}
