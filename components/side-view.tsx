import { useState } from 'react'
import { LoaderCircle, RotateCw } from 'lucide-react'

import { ArtifactView } from '@/components/artifact-view'
import { CodeView } from '@/components/code-view'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from "@/components/ui/button"
import { Link, Copy } from 'lucide-react'
import { TemplateId } from '@/lib/templates'
import { ArtifactSchema } from '@/lib/schema'
import { ExecutionResult } from '@/app/api/sandbox/route'

export function SideView({
  // userID,
  isLoading,
  artifact,
  result,
  selectedTemplate,
}: {
  // userID: string
  isLoading: boolean
  artifact?: ArtifactSchema
  result?: ExecutionResult
  selectedTemplate: TemplateId
}) {
  const [iframeKey, setIframeKey] = useState(0)
  function refreshIframe() {
    setIframeKey(prevKey => prevKey + 1)
  }

  if (!artifact) {
    return null
  }

  const isLinkAvailable = selectedTemplate !== 'code-interpreter-multilang'

  function copy (content: string) {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Copied to clipboard')
      })
      .catch(err => {
        alert('Failed to copy: ' + content)
      })
  }

  return (
    <div className="flex-1 flex flex-col shadow-2xl rounded-lg border border-[#FFE7CC] bg-white max-w-[800px]">
      <Tabs defaultValue="code" className="h-full max-h-full overflow-hidden flex flex-col items-start justify-start">
        <div className="w-full p-2 grid grid-cols-3 items-center justify-end bg-[#FAFAFA] rounded-t-lg border-b border-[#FFE7CC]">
          <div className='flex justify-start'>
            {isLoading && <LoaderCircle className="h-4 w-4 text-black/15 animate-spin" />}
          </div>

          <div className='flex justify-center'>
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger className="font-normal text-xs py-1 px-2" value="code">Code</TabsTrigger>
              <TabsTrigger disabled={!result} className="font-normal text-xs py-1 px-2" value="artifact">Preview</TabsTrigger>
            </TabsList>
          </div>
          <div className='flex items-center justify-end space-x-2'>
          {result && (
            <Button disabled={!isLinkAvailable} variant="outline" className='h-8 rounded-md px-3' onClick={() => refreshIframe()}>
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
          {result && (
            <Button disabled={!isLinkAvailable} variant="outline" className='h-8 rounded-md px-3' onClick={() => copy(result.url!)}>
              <Link className="h-4 w-4" />
            </Button>
          )}
          {result && (
            <Button variant="outline" className='h-8 rounded-md px-3' onClick={() => copy(artifact.code)}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {/* {selectedTemplate === SandboxTemplate.NextJS && (
            <DeployDialog userID={userID} />
          )} */}
          </div>
        </div>

        {artifact && (
          <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
            <TabsContent value="code" className="flex-1 w-full">
              {artifact.code &&
                <CodeView code={artifact.code} template={artifact.template as TemplateId}/>
              }
            </TabsContent>
            <TabsContent value="artifact" className="flex-1 w-full flex flex-col items-start justify-start">
              {result &&
                <ArtifactView
                  iframeKey={iframeKey}
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
