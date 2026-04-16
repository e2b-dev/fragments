'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isFileInArray } from '@/lib/utils'
import { ArrowRight, Paperclip, Square, X } from 'lucide-react'
import { motion } from 'motion/react'
import { type SetStateAction, useEffect, useMemo, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Logo from './logo'

export function LandingHero({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  stop,
  isMultiModal,
  files,
  handleFileChange,
  isErrored,
  errorMessage,
  isRateLimited,
  retry,
  children,
}: {
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  stop: () => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  isErrored: boolean
  errorMessage: string
  isRateLimited: boolean
  retry: () => void
  children: React.ReactNode
}) {
  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        onSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

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

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          handleFileChange((prev) => {
            if (!isFileInArray(file, prev)) {
              return [...prev, file]
            }
            return prev
          })
        }
      }
    }
  }

  const [dragActive, setDragActive] = useState(false)

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
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
        const uniqueFiles = droppedFiles.filter((file) => !isFileInArray(file, prev))
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
    ))
  }, [files])

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal])

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 pb-16">
      {/* Hero heading */}
      <motion.div
        className="text-center max-w-3xl mb-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight text-foreground leading-[1.1] mb-6">
          Direct Booking Websites for the AI Era
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          <span className="font-semibold text-foreground">Stop losing 15-20% to OTAs.</span> Staycy
          creates stunning websites for hotels and vacation rentals, integrates booking engines and
          makes them discoverable by Google and ChatGPT.
        </p>
      </motion.div>

      {/* Prompt section */}
      <motion.div
        className="w-full max-w-2xl mt-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-semibold text-sm text-foreground">
            Tell Staycy About Your Business
          </span>
        </div>

        <form
          onSubmit={onSubmit}
          onKeyDown={onEnter}
          className="mb-2"
          onDragEnter={isMultiModal ? handleDrag : undefined}
          onDragLeave={isMultiModal ? handleDrag : undefined}
          onDragOver={isMultiModal ? handleDrag : undefined}
          onDrop={isMultiModal ? handleDrop : undefined}
        >
          {isErrored && (
            <div
              className={`flex items-center p-1.5 text-sm font-medium mb-4 rounded-xl ${
                isRateLimited
                  ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                  : 'bg-[var(--error-bg)] text-[var(--error)]'
              }`}
            >
              <span className="flex-1 px-1.5">{errorMessage}</span>
              <button
                type="button"
                className={`px-2 py-1 rounded-sm ${
                  isRateLimited ? 'bg-[var(--warning-bg)]' : 'bg-[var(--error-bg)]'
                }`}
                onClick={retry}
              >
                Try again
              </button>
            </div>
          )}
          <div className="relative">
            <div
              className={`shadow-md rounded-2xl relative z-10 bg-background border ${
                dragActive
                  ? 'before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary'
                  : ''
              }`}
            >
              <div className="flex items-center px-3 py-2 gap-1">{children}</div>
              <TextareaAutosize
                autoFocus
                minRows={3}
                maxRows={6}
                className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none placeholder:text-muted-foreground/60"
                required
                placeholder="e.g., We manage 5 luxury beachfront villas in Malibu with private pools and concierge service..."
                value={input}
                onChange={onInputChange}
                onPaste={isMultiModal ? handlePaste : undefined}
              />
              <div className="flex p-3 gap-2 items-center">
                <input
                  type="file"
                  id="multimodal-landing"
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
                            document.getElementById('multimodal-landing')?.click()
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
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generate Website</TooltipContent>
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
        </form>
      </motion.div>

      {/* Powered by logos */}
      <motion.div
        className="flex flex-col items-center mt-10 gap-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
      >
        <span className="text-body-sm text-muted-foreground uppercase tracking-widest font-medium">
          Powered by
        </span>
        <div className="flex items-center justify-center gap-10">
          {/* OnSeason - logomark + wordmark */}
          <a
            href="https://onseason.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Logo className="h-6" />
            <span className="font-display font-bold text-base text-foreground">onseason</span>
          </a>

          {/* Anthropic - icon + wordmark */}
          <a
            href="https://anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <AnthropicIcon className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-base text-foreground tracking-tight">
              Anthropic
            </span>
          </a>

          {/* OpenAI - icon + wordmark */}
          <a
            href="https://openai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <OpenAIIcon className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-base text-foreground tracking-tight">OpenAI</span>
          </a>

          {/* E2B - star logo + orange "E2B" */}
          <a
            href="https://e2b.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <E2BStarLogo className="h-5 w-5 text-foreground" />
            <span className="font-bold text-base text-[#ff8800]">E2B</span>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Logo components ── */

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"
        fill="currentColor"
      />
    </svg>
  )
}

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
        fill="currentColor"
      />
    </svg>
  )
}

function E2BStarLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 224 232" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M188.212 157.998C186.672 157.998 185.71 159.665 186.48 160.998L202.585 188.894C203.476 190.437 202.056 192.287 200.335 191.826L151.491 178.737C149.357 178.165 147.163 179.432 146.592 181.566L133.504 230.411C133.042 232.132 130.731 232.436 129.84 230.893L113.732 202.992C112.962 201.659 111.037 201.659 110.268 202.992L94.1595 230.893C93.2686 232.436 90.9568 232.132 90.4956 230.411L77.4075 181.566C76.8357 179.432 74.6423 178.165 72.5085 178.737L23.664 191.826C21.9429 192.287 20.5234 190.437 21.4143 188.894L37.5192 160.998C38.289 159.665 37.3267 157.998 35.7871 157.998L3.57893 157.998C1.79713 157.998 0.904821 155.844 2.16476 154.584L37.9218 118.827C39.484 117.265 39.484 114.733 37.9218 113.171L2.16478 77.4133C0.904844 76.1533 1.7972 73.999 3.57902 73.9991L35.7837 73.9995C37.3233 73.9995 38.2856 72.3328 37.5158 70.9995L21.4143 43.11C20.5234 41.5669 21.9429 39.717 23.664 40.1781L72.5085 53.2665C74.6423 53.8383 76.8357 52.572 77.4075 50.4381L90.4956 1.59292C90.9568 -0.128187 93.2686 -0.432531 94.1595 1.11058L110.267 29.0111C111.037 30.3445 112.962 30.3445 113.732 29.0111L129.84 1.11058C130.73 -0.432532 133.042 -0.128189 133.503 1.59292L146.592 50.4381C147.163 52.572 149.357 53.8383 151.491 53.2665L200.335 40.1781C202.056 39.717 203.476 41.5669 202.585 43.11L186.483 70.9995C185.713 72.3328 186.676 73.9995 188.215 73.9995L220.421 73.9991C222.203 73.999 223.095 76.1533 221.835 77.4133L186.078 113.171C184.516 114.733 184.516 117.265 186.078 118.827L221.835 154.584C223.095 155.844 222.203 157.998 220.421 157.998L188.212 157.998ZM175.919 81.3306C177.366 79.8837 175.963 77.4549 173.987 77.9845L130.491 89.6396C128.357 90.2114 126.164 88.9451 125.592 86.8112L113.931 43.293C113.402 41.3166 110.597 41.3166 110.068 43.293L98.4069 86.8112C97.8351 88.9451 95.6418 90.2114 93.5079 89.6396L50.0136 77.9849C48.0371 77.4553 46.6348 79.8841 48.0817 81.331L79.9216 113.171C81.4837 114.733 81.4837 117.266 79.9216 118.828L48.0742 150.675C46.6273 152.122 48.0296 154.55 50.0061 154.021L93.5079 142.364C95.6418 141.792 97.8351 143.059 98.4069 145.192L110.068 188.711C110.597 190.687 113.402 190.687 113.931 188.711L125.592 145.192C126.164 143.059 128.357 141.792 130.491 142.364L173.994 154.021C175.971 154.551 177.373 152.122 175.926 150.675L144.079 118.828C142.516 117.266 142.516 114.733 144.079 113.171L175.919 81.3306Z"
        fill="currentColor"
      />
    </svg>
  )
}
