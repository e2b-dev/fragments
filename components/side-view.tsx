import { JSONValue, type ToolInvocation } from 'ai'
import { LoaderCircle } from 'lucide-react'

import { ArtifactView, CodeExecResult } from '@/components/artifact-view'
import { CodeView } from '@/components/code-view'
import { SandboxTemplate } from '@/lib/types'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { DeployDialog } from '@/components/deploy-dialog'
import { Button } from "@/components/ui/button"
import { Link, Copy } from 'lucide-react'

export function SideView({
  // userID,
  toolInvocation,
  data,
  selectedTemplate,
}: {
  // userID: string
  toolInvocation?: ToolInvocation
  data?: JSONValue[]
  selectedTemplate: SandboxTemplate
}) {
  if (!toolInvocation || !data) {
    return null
  }

  const { args, result }: { args: Record<string, any>, result?: CodeExecResult } = toolInvocation
  let latestData: any = {
    state: 'initial',
  }
  if (data.length > 0) {
    const latest = data[data.length - 1]
    if (latest) {
      latestData = latest
    }
  }

  const isLinkAvailable = selectedTemplate === SandboxTemplate.NextJS || selectedTemplate === SandboxTemplate.Streamlit

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
            {latestData.state === 'running' && <LoaderCircle className="h-4 w-4 text-black/15 animate-spin" />}
          </div>

          <div className='flex justify-center'>
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger className="font-normal text-xs py-1 px-2" value="code">Code</TabsTrigger>
              <TabsTrigger className="font-normal text-xs py-1 px-2" value="artifact">Preview</TabsTrigger>
            </TabsList>
          </div>
          <div className='flex items-center justify-end space-x-2'>
          {result && (
            <Button variant="outline" className='h-8 rounded-md px-3' onClick={() => copy(args.code)}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {result && (
            <Button disabled={!isLinkAvailable} variant="outline" className='h-8 rounded-md px-3' onClick={() => copy(result.url)}>
              <Link className="h-4 w-4" />
            </Button>
          )}
          {/* {selectedTemplate === SandboxTemplate.NextJS && (
            <DeployDialog userID={userID} />
          )} */}
          </div>
        </div>

        {toolInvocation && (
          <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
            <TabsContent value="code" className="flex-1 w-full">
              <CodeView code={args.code} template={result?.template}/>
            </TabsContent>
            <TabsContent value="artifact" className="flex-1 w-full flex flex-col items-start justify-start">
              <ArtifactView
                template={result?.template}
                result={result}
              />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
