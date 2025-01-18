import { GitHubIcon } from './icons'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

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
        'before:absolute before:w-full before:h-full before:bg-[radial-gradient(circle_at_50%_-50%,rgba(255,255,255,0.1),transparent_70%)] dark:before:bg-[radial-gradient(circle_at_50%_-50%,rgba(255,255,255,0.1),transparent_70%)] before:rounded-2xl before:pointer-events-none',
      )}
    >
      <GitHubIcon className="w-4 h-4" aria-hidden="true" />
      <Separator
        orientation="vertical"
        className="h-6 bg-[hsl(var(--border))]"
        aria-hidden="true"
      />
      <div
        className="flex items-center gap-1.5"
        role="status"
        aria-live="polite"
      >
        <Star
          className="w-4 h-4 text-muted-foreground transition-transform group-hover:rotate-[360deg] duration-300 ease-in-out"
          aria-label="GitHub stars"
        />
        <span className="text-sm text-muted-foreground">
          {repoData.stargazers_count}
        </span>
      </div>
    </a>
  )
}
