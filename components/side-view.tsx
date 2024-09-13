import { Dispatch, SetStateAction, useState } from 'react'
import { ChevronRight, ChevronsRight, Download, LoaderCircle, RotateCw } from 'lucide-react'

import { ArtifactView } from '@/components/artifact-view'
import { CodeView } from '@/components/code-view'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Link, Copy } from 'lucide-react'
import { TemplateId } from '@/lib/templates'
import { ArtifactSchema } from '@/lib/schema'
import { ExecutionResult } from '@/app/api/sandbox/route'

export function SideView({
  // userID,
  selectedTab,
  onSelectedTabChange,
  isLoading,
  artifact,
  result,
  selectedTemplate,
}: {
  // userID: string
  selectedTab: 'code' | 'artifact'
  onSelectedTabChange: Dispatch<SetStateAction<"code" | "artifact">>
  isLoading: boolean
  artifact?: ArtifactSchema
  result?: ExecutionResult
  selectedTemplate: TemplateId
}) {
  if (!artifact) {
    return null
  }

  const isLinkAvailable = selectedTemplate !== 'code-interpreter-multilang'

  function download (filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="flex-1 flex flex-col shadow-2xl rounded-tl-3xl rounded-bl-3xl border-l border-y max-w-[800px] bg-popover">
      <Tabs value={selectedTab} onValueChange={(value) => onSelectedTabChange(value as 'code' | 'artifact')} className="h-full max-h-full overflow-hidden flex flex-col items-start justify-start">
        <div className="w-full p-2 grid grid-cols-3 items-center border-b">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className='text-muted-foreground'>
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Close sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className='flex justify-center'>
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger className="font-normal text-xs py-1 px-2 gap-1 flex items-center" value="code">
                {isLoading && <LoaderCircle strokeWidth={3} className="h-3 w-3 animate-spin" />}
                Code
              </TabsTrigger>
              <TabsTrigger disabled={!result} className="font-normal text-xs py-1 px-2" value="artifact">
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
          {result && (
            <div className='flex items-center justify-end'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled={!isLinkAvailable} variant="ghost" className='text-muted-foreground' onClick={() => download(artifact.file_path, artifact.code)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Download
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {artifact && (
          <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
            <TabsContent value="code" className="flex-1 w-full">
              {artifact.code &&
                <CodeView code={artifact.code} lang={artifact.file_path?.split('.').pop() || ''}/>
              }
            </TabsContent>
            <TabsContent value="artifact" className="flex-1 w-full flex flex-col items-start justify-start">
              {result &&
                <ArtifactView
                  template={artifact.template as TemplateId}
                  result={result}
                />
              }
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
