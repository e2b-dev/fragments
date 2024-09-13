import { ArrowUp, ImagePlus, Paperclip, Square, X } from 'lucide-react'

import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import TextareaAutosize from 'react-textarea-autosize'
import { useMemo } from 'react'

export function ChatInput({
  isLoading,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
}: {
  isLoading: boolean,
  stop: () => void,
  input: string,
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
  isMultiModal: boolean,
  files: File[],
  handleFileChange: (files: File[]) => void,
  children: React.ReactNode,
}) {
  function handleFileInput (e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange(Array.from(e.target.files || []))
  }

  function handleFileRemove (file: File) {
    const newFiles = files ? Array.from(files).filter(f => f !== file) : []
    handleFileChange(newFiles)
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span onClick={() => handleFileRemove(file)} className="absolute top-[-8] right-[-8] bg-muted rounded-full p-1">
            <X className="h-3 w-3" />
          </span>
          <img src={URL.createObjectURL(file)} alt={file.name} className="rounded-xl w-10 h-10 object-cover" />
        </div>
      )
    })
  }, [files])

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col mt-auto bg-background shadow-lg rounded-2xl border">
      <div className="px-3 py-2">
        {children}
      </div>
      <TextareaAutosize autoFocus={true} minRows={1} maxRows={5} className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none" required={true} placeholder="Describe your app..." value={input} onChange={handleInputChange} />
      <div className='flex p-3 gap-2 items-center'>
        <input type="file" id="multimodal" name="multimodal" accept="image/*" multiple={true} className="hidden" onChange={handleFileInput} />
        <div className="flex items-center flex-1 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={!isMultiModal} type="button" variant="outline" size="icon" className="rounded-xl h-10 w-10" onClick={(e) => { e.preventDefault(); document.getElementById('multimodal')?.click() }}>
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Add attachments
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {files.length > 0 && filePreview}
        </div>
        <div>
          { !isLoading ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" type="submit" className='rounded-xl h-10 w-10'>
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Send message
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" className='rounded-xl h-10 w-10' onClick={(e) => { e.preventDefault(); stop() }}>
                    <Square className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Stop generation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        </div>
      </div>
    </form>
  )
}
