import { useEffect } from 'react'
import { publish } from '@/app/actions/publish'
import { Button } from '@/components/ui/button'

export function DeployButton({ url, sbxId, apiKey }: { url: string, sbxId: string, apiKey: string | undefined }) {
  useEffect(() => {
    async function deploy() {
      await publish(url, sbxId, '1h', apiKey)
    }

    deploy()
  }, [url, sbxId, apiKey])

  return (
    <Button variant="default">
      Deploy
    </Button>
  )
}
