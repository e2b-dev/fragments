'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/use-ui-store'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

const devices = [
  { id: 'desktop', icon: Monitor, label: 'desktop' },
  { id: 'tablet', icon: Tablet, label: 'tablet' },
  { id: 'mobile', icon: Smartphone, label: 'mobile' },
] as const

export function DeviceToggle() {
  const previewDevice = useUiStore((s) => s.previewDevice)
  const setPreviewDevice = useUiStore((s) => s.setPreviewDevice)

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--preview-frame)]">
      {devices.map(({ id, icon: Icon, label }) => (
        <TooltipProvider key={id}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant={previewDevice === id ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewDevice(id)}
                aria-label={`Switch to ${label} preview`}
                aria-pressed={previewDevice === id}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {label.charAt(0).toUpperCase() + label.slice(1)} preview
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
