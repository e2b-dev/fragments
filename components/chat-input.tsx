'use client'

import './chat-input.css'
import { RepoBanner } from './repo-banner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { encodeReferenceId } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { isFileInArray } from '@/lib/utils'
import { DeepPartial } from 'ai'
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Mention, MentionsInput, SuggestionDataItem } from 'react-mentions'

// ← base styles (optional, override with yours)

export function ChatInput({
  retry,
  isErrored,
  errorMessage,
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
  fragment,
  setAddMentionHandler,
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
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
  fragment: DeepPartial<FragmentSchema> | undefined
  setAddMentionHandler?: (
    handler: (mention: { id: string; display: string }) => void,
  ) => void
}) {
  const mentionsRef = useRef<HTMLDivElement>(null)
  const inputElementRef = useRef<HTMLTextAreaElement | null>(null)
  const cursorPositionRef = useRef<number | null>(null)
  const updateCursorPosition = useCallback(() => {
    cursorPositionRef.current = inputElementRef.current?.selectionStart ?? null
  }, [])

  // For demo: fake data for @mentions
  const users: SuggestionDataItem[] = fragment?.file_path
    ? [
        {
          id: encodeReferenceId(fragment.file_path),
          display: fragment.file_path,
        },
      ]
    : []

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handlePaste(e: React.ClipboardEvent) {
    // same as before – image handling
    const items = Array.from(e.clipboardData.items)
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          handleFileChange((prev) => {
            if (!isFileInArray(file, prev)) return [...prev, file]
            return prev
          })
        }
      }
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [dragActive, setDragActive] = useState(false)

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (droppedFiles.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedFiles.filter(
          (file) => !isFileInArray(file, prev),
        )
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => (
      <div className="relative" key={file.name}>
        <span
          onClick={() => handleFileRemove(file)}
          className="absolute -top-2 -right-2 bg-muted rounded-full p-1"
        >
          <X className="h-3 w-3 cursor-pointer" />
        </span>
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="rounded-xl w-10 h-10 object-cover"
        />
      </div>
    ))
  }, [files])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal])

  // Quick demo button: insert a fake chip/mention programmatically
  const _addMention = useCallback(
    (mention: { id: string; display: string }) => {
      // react-mentions default markup format: @[__display__](__id__)
      const encodedId = encodeReferenceId(mention.id)
      const newMention = `@[${mention.display}](${encodedId}) `
      const insertionPoint = cursorPositionRef.current ?? input.length
      const nextValue =
        input.slice(0, insertionPoint) +
        newMention +
        input.slice(insertionPoint)
      const nextCursor = insertionPoint + newMention.length

      handleInputChange({
        target: { value: nextValue },
      } as React.ChangeEvent<HTMLTextAreaElement>)

      cursorPositionRef.current = nextCursor
      requestAnimationFrame(() => {
        if (!inputElementRef.current) return
        inputElementRef.current.focus()
        inputElementRef.current.setSelectionRange(nextCursor, nextCursor)
      })
    },
    [handleInputChange, input],
  )

  useEffect(() => {
    setAddMentionHandler?.(_addMention)
  }, [setAddMentionHandler, _addMention])

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 mt-auto flex flex-col bg-background"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      {/* error banner same as before */}

      <div className="relative">
        <RepoBanner className="absolute bottom-full inset-x-2 translate-y-1 z-0 pb-2" />
        <div
          className={`shadow-md rounded-2xl relative z-10 bg-background border ${
            dragActive
              ? 'before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary'
              : ''
          }`}
        >
          <div className="flex items-center px-3 py-2 gap-1">{children}</div>

          {mounted ? (
            <MentionsInput
              value={input}
              inputRef={(el: HTMLTextAreaElement | null) => {
                inputElementRef.current = el
              }}
              onChange={(e) => {
                updateCursorPosition()
                handleInputChange({
                  ...e,
                  target: { ...e.target, value: e.target.value },
                } as any)
              }}
              onSelect={updateCursorPosition}
              onKeyUp={updateCursorPosition}
              onClick={updateCursorPosition}
              className="mentions"
              style={{}}
              placeholder="Describe your app... @someone or type anywhere"
              disabled={isErrored}
              onPaste={isMultiModal ? handlePaste : undefined}
              singleLine={false}
              allowSpaceInQuery
            >
              <Mention
                trigger="@"
                data={users}
                appendSpaceOnAdd
                displayTransform={(id, display) => `@${display}`}
                renderSuggestion={(
                  suggestion: SuggestionDataItem,
                  search,
                  highlightedDisplay,
                  index,
                  focused,
                ) => (
                  <div className={`p-2 ${focused ? 'bg-accent' : ''}`}>
                    @{suggestion.display}
                  </div>
                )}
                className="mentions__mention mentions__mention--removable"
              />
            </MentionsInput>
          ) : (
            <div className="mentions">
              <textarea
                className="mentions__input"
                placeholder="Describe your app... @someone or type anywhere"
                disabled
              />
            </div>
          )}

          {/* Ad-hoc test button – inserts fake chip */}
          <div className="flex p-3 gap-2 items-center">
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              aria-label="Add image attachments"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="flex items-center flex-1 gap-2">
              {/* file button same */}
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

            {/* send / stop buttons same as before */}
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
      </div>

      {/* footer same */}
    </form>
  )
}
