'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ExecutionResult } from '@/lib/types'
import { useSandboxStore } from '@/stores/use-sandbox-store'
import { useUiStore } from '@/stores/use-ui-store'
import { ChevronsRight, RefreshCw, RotateCw } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { FragmentPreview } from '../fragment-preview'
import { CopyButton } from '../ui/copy-button'
import { CodeShimmer } from './code-shimmer'
import { DeviceToggle } from './device-toggle'

interface PreviewPaneProps {
  streamingCode?: string | null
  result?: ExecutionResult
  onClose?: () => void
}

const iframeWidthClass: Record<string, string> = {
  desktop: 'h-full w-full',
  tablet: 'h-full max-w-[768px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
  mobile: 'h-full max-w-[430px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
}

export function PreviewPane({ streamingCode, result, onClose }: PreviewPaneProps) {
  const previewUrl = useSandboxStore((s) => s.previewUrl)
  const bootStatus = useSandboxStore((s) => s.boot.status)
  const bootSandbox = useSandboxStore((s) => s.bootSandbox)
  const previewDevice = useUiStore((s) => s.previewDevice)
  const [iframeKey, setIframeKey] = useState(0)
  const isBooting = bootStatus === 'loading'
  const isExpired = bootStatus === 'error' && !previewUrl

  return (
    <div className="flex h-full flex-col shadow-2xl rounded-tl-3xl rounded-bl-3xl border-l border-y border-[var(--preview-frame)] bg-[var(--preview-bg)] overflow-hidden">
      <div className="grid grid-cols-3 items-center w-full px-2 py-1.5 border-b border-[var(--preview-frame)]">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground h-7 w-7"
                onClick={() => onClose?.()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close preview</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex justify-center">
          <DeviceToggle />
        </div>
        <div />
      </div>
      <div className="relative flex-1 min-h-0">
        {isBooting ? (
          <CodeShimmer code={streamingCode} />
        ) : previewUrl ? (
          <div className="flex h-full flex-col">
            <div className="flex flex-1 min-h-0 items-center justify-center">
              <iframe
                key={iframeKey}
                src={previewUrl}
                title="Site preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className={iframeWidthClass[previewDevice] ?? iframeWidthClass.desktop}
              />
            </div>
            <div className="p-2 border-t border-[var(--preview-frame)]">
              <div className="flex items-center bg-[var(--surface-subtle)] rounded-2xl">
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        className="text-muted-foreground"
                        onClick={() => setIframeKey((k) => k + 1)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-muted-foreground text-body-sm flex-1 text-ellipsis overflow-hidden whitespace-nowrap">
                  {previewUrl}
                </span>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <CopyButton
                        variant="link"
                        content={previewUrl}
                        className="text-muted-foreground"
                      />
                    </TooltipTrigger>
                    <TooltipContent>Copy URL</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
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
        ) : result ? (
          <div className="overflow-y-auto w-full h-full">
            <FragmentPreview result={result} />
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
