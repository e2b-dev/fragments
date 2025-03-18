import { useState } from 'react'
import { Button } from './ui/button'
import { CopyButton } from './ui/copy-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Download, FileText } from 'lucide-react'

export function FragmentCode({
  files,
}: {
  files: { name: string; content: string }[]
}) {
  const [currentFile, setCurrentFile] = useState(files[0].name)
  const [code, setCode] = useState(files[0].content)
  const currentFileContent = files.find(
    (file) => file.name === currentFile,
  )?.content

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

  function handleCodeChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setCode(event.target.value)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-2 pt-1 gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {files.map((file) => (
            <div
              key={file.name}
              className={`flex gap-2 select-none cursor-pointer items-center text-sm text-muted-foreground px-2 py-1 rounded-md hover:bg-muted border ${
                file.name === currentFile ? 'bg-muted border-muted' : ''
              }`}
              onClick={() => {
                setCurrentFile(file.name)
                setCode(file.content)
              }}
            >
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <CopyButton
                  content={code}
                  className="text-muted-foreground"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={() =>
                    download(currentFile, code)
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-x-auto">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="w-full h-full p-4 pt-2 text-sm bg-transparent border-none resize-none focus:outline-none"
        />
      </div>
    </div>
  )
}
