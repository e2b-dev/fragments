import { useState } from 'react'
import { LoaderCircle, RotateCw } from 'lucide-react'

import { ArtifactView } from '@/components/artifact-view'

import { Button } from "@/components/ui/button"
import { Copy } from 'lucide-react'
import { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/sandbox'

export function SideView({
  // userID,
  isLoading,
  result,
  selectedTemplate,
}: {
  // userID: string
  isLoading: boolean
  result?: ExecutionResult
  selectedTemplate: TemplateId
}) {
  const [iframeKey, setIframeKey] = useState(0)
  function refreshIframe() {
    setIframeKey(prevKey => prevKey + 1)
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
      <div className="w-full p-2 grid grid-cols-2 items-center justify-end bg-[#FAFAFA] rounded-t-lg border-b border-[#FFE7CC]">
        <div className='flex flex-1 justify-start'>
          {isLoading && <LoaderCircle className="h-4 w-4 text-black/15 animate-spin" />}
        </div>

        <div className='flex items-center justify-end space-x-2'>
          <Button disabled={!isLinkAvailable} variant="outline" className='h-8 rounded-md px-3' onClick={() => refreshIframe()}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button disabled={!isLinkAvailable} variant="outline" className='h-8 rounded-md px-3' onClick={() => copy(result?.url || '')}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
        {result && (
          <ArtifactView
            iframeKey={iframeKey}
            template={result.template as TemplateId}
            result={result}
          />
        )}
      </div>
    </div>
  )
}
