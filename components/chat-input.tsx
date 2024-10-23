import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import { SetStateAction, useMemo } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

export function ChatInput({
  retry,
  isErrored,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
}: {
  retry: () => void
  isErrored: boolean
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  children: React.ReactNode
}) {
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => [...prev, ...Array.from(e.target.files || [])])
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute top-[-8] right-[-8] bg-muted rounded-full p-1"
          >
            <X className="h-3 w-3 cursor-pointer" />
          </span>
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="rounded-xl w-10 h-10 object-cover"
          />
        </div>
      )
    })
  }, [files])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 flex flex-col mt-auto bg-background"
    >
      {isErrored && (
        <div
          className={`flex items-center p-1.5 text-sm font-medium mb-2 rounded-xl ${
            isRateLimited
              ? 'bg-orange-400/10 text-orange-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          <span className="flex-1 px-1.5">
            {isRateLimited
              ? 'You have reached your request limit for the day.'
              : 'An unexpected error has occurred.'}
          </span>
          <button
            className={`px-2 py-1 rounded-sm ${
              isRateLimited ? 'bg-orange-400/20' : 'bg-red-400/20'
            }`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}
      <div className="shadow-md rounded-2xl border">
        <div className="flex items-center px-3 py-2 gap-1">{children}</div>
        <TextareaAutosize
          autoFocus={true}
          minRows={1}
          maxRows={5}
          className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none"
          required={true}
          placeholder="Describe your app..."
          disabled={isErrored}
          value={input}
          onChange={handleInputChange}
        />
        <div className="flex p-3 gap-2 items-center">
          <input
            type="file"
            id="multimodal"
            name="multimodal"
            accept="image/*"
            multiple={true}
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex items-center flex-1 gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!isMultiModal || isErrored}
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl h-10 w-10"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('multimodal')?.click()
                    }}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add attachments</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {files.length > 0 && filePreview}
          </div>
          <div>
            {!isLoading ? (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={isErrored}
                      variant="default"
                      size="icon"
                      type="submit"
                      className="rounded-xl h-10 w-10"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-xl h-10 w-10"
                      onClick={(e) => {
                        e.preventDefault()
                        stop()
                      }}
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Fragments is an open-source project made by{' '}
        <a href="https://e2b.dev" target="_blank" className="text-[#ff8800]">
          ✶ E2B
        </a>
      </p>
    </form>
  )
}
