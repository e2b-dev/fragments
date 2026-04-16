'use client'

import { Button } from '@/components/ui/button'
import { useSandboxStore } from '@/stores/use-sandbox-store'
import { useUiStore } from '@/stores/use-ui-store'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { CodeShimmer } from './code-shimmer'
import { DeviceToggle } from './device-toggle'

interface PreviewPaneProps {
  streamingCode?: string | null
}

const iframeWidthClass: Record<string, string> = {
  desktop: 'h-full w-full',
  tablet: 'h-full max-w-[768px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
  mobile: 'h-full max-w-[430px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
}

export function PreviewPane({ streamingCode }: PreviewPaneProps) {
  const previewUrl = useSandboxStore((s) => s.previewUrl)
  const bootStatus = useSandboxStore((s) => s.boot.status)
  const bootSandbox = useSandboxStore((s) => s.bootSandbox)
  const previewDevice = useUiStore((s) => s.previewDevice)

  const isBooting = bootStatus === 'loading'
  const isExpired = bootStatus === 'error' && !previewUrl

  return (
    <div className="flex h-full flex-col bg-[var(--preview-bg)]">
      <DeviceToggle />
      <div className="relative flex-1 min-h-0">
        {isBooting ? (
          <CodeShimmer code={streamingCode} />
        ) : previewUrl ? (
          <div className="flex h-full items-center justify-center">
            <iframe
              src={previewUrl}
              title="Site preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className={iframeWidthClass[previewDevice] ?? iframeWidthClass.desktop}
            />
          </div>
        ) : isExpired ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
              src="/staycy-only-dark.svg"
              alt="Staycy"
              width={80}
              height={11}
              style={{ width: 80, height: 'auto' }}
              className="opacity-30"
            />
            <Button
              variant="secondary"
              onClick={() => bootSandbox({ type: 'template' })}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload preview
            </Button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
              src="/staycy-only-dark.svg"
              alt="Staycy"
              width={80}
              height={11}
              style={{ width: 80, height: 'auto' }}
              className="opacity-30"
            />
            <p className="text-body text-muted-foreground">Your preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
