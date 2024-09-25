import { ArtifactView } from './artifact-view'
import { CodeView } from './code-view'
import { PublishDialog } from './publish-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArtifactSchema } from '@/lib/schema'
import { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { ChevronsRight, Copy, Download, LoaderCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

export function SideView({
  // userID,
  apiKey,
  selectedTab,
  onSelectedTabChange,
  isLoading,
  artifact,
  result,
  onClose,
}: {
  // userID: string
  apiKey: string | undefined
  selectedTab: 'code' | 'artifact'
  onSelectedTabChange: Dispatch<SetStateAction<'code' | 'artifact'>>
  isLoading: boolean
  artifact?: DeepPartial<ArtifactSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  if (!artifact) {
    return null
  }

  const isLinkAvailable = result?.template !== 'code-interpreter-multilang'

  function copy(content: string) {
    navigator.clipboard.writeText(content)
    alert('Copied to clipboard')
  }

  function download(filename: string, content: string) {
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
    <div className="absolute md:relative top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'artifact')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 grid grid-cols-3 items-center border-b">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={onClose}
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="code"
              >
                {isLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!result}
                className="font-normal text-xs py-1 px-2"
                value="artifact"
              >
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
          {result && (
            <div className="flex items-center justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => copy(artifact.code || '')}
                      disabled={!artifact.code}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() =>
                        download(artifact.file_path || '', artifact.code || '')
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isLinkAvailable && (
                <PublishDialog
                  url={result.url!}
                  sbxId={result.sbxId!}
                  apiKey={apiKey}
                />
              )}
            </div>
          )}
        </div>

        {artifact && (
          <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
            <TabsContent value="code" className="flex-1 w-full">
              {artifact.code && (
                <CodeView
                  code={artifact.code}
                  lang={artifact.file_path?.split('.').pop() || ''}
                />
              )}
            </TabsContent>
            <TabsContent
              value="artifact"
              className="flex-1 w-full flex flex-col items-start justify-start"
            >
              {result && (
                <ArtifactView
                  title={artifact.title}
                  template={artifact.template as TemplateId}
                  result={result}
                />
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
