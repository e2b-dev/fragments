import Logo from './logo'
import { CopyButton } from './ui/copy-button'
import { publish } from '@/app/actions/publish'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'

export function DeployDialog({
  url,
  sbxId,
  apiKey,
}: {
  url: string
  sbxId: string
  apiKey: string | undefined
}) {
  const posthog = usePostHog()

  const [publishedURL, setPublishedURL] = useState<string | null>(null)
  useEffect(() => {
    setPublishedURL(null)
  }, [url])

  async function publishURL() {
    const { url: publishedURL } = await publish(url, sbxId, apiKey)
    setPublishedURL(publishedURL)
    posthog.capture('publish_url', {
      url: publishedURL,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">
          <Logo style="e2b" width={16} height={16} className="mr-2" />
          Deploy to E2B
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-4 w-80 flex flex-col gap-2">
        <div className="text-sm font-semibold">Deploy to E2B</div>
        <div className="text-sm text-muted-foreground">
          Deploying the fragment will make it publicly accessible to others via
          link for a limited time.
        </div>
        <div className="text-sm text-muted-foreground">
          The fragment will be made available for up to 30 minutes.
        </div>
        <div className="flex flex-col gap-2">
          {publishedURL && (
            <div className="flex items-center gap-2">
              <Input value={publishedURL} readOnly />
              <CopyButton content={publishedURL} />
            </div>
          )}
          <Button
            variant="default"
            onClick={publishURL}
            disabled={publishedURL !== null}
          >
            {publishedURL ? 'Deployed' : 'Confirm and deploy'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
