import { useReducedMotion } from '@/components/motion-provider'
import { getVariant, useTypewriter } from '@/lib/chat'
import type { Message } from '@/lib/messages'
import type { FragmentSchema } from '@/lib/schema'
import type { ExecutionResult } from '@/lib/types'
import type { DeepPartial } from 'ai'
import { LoaderIcon, Terminal } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'

function TypewriterText({ text, enabled }: { text: string; enabled: boolean }) {
  const revealed = useTypewriter(text, enabled)
  return <>{revealed}</>
}

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}) {
  const prefersReducedMotion = useReducedMotion()
  const messageVariant = getVariant('chatMessage', prefersReducedMotion)
  const lastAssistantIndex = useMemo(
    () => messages.findLastIndex((m) => m.role === 'assistant'),
    [messages],
  )

  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div id="chat-container" className="flex flex-col pb-12 gap-2 overflow-y-auto max-h-full">
      {messages.map((message: Message, index: number) => (
        <motion.div
          className={`flex flex-col px-4 shadow-sm whitespace-pre-wrap text-body ${message.role !== 'user' ? 'text-foreground py-4 gap-4 w-full md:pl-10' : 'bg-primary/10 dark:bg-primary/20 py-2 rounded-xl gap-2 w-fit'} font-sans`}
          key={index}
          initial={messageVariant.initial}
          animate={messageVariant.animate}
          transition={messageVariant.transition}
        >
          {message.content.map((content, id) => {
            if (content.type === 'text') {
              const isLatestAssistant = message.role === 'assistant' && index === lastAssistantIndex
              return (
                <TypewriterText
                  key={id}
                  text={content.text}
                  enabled={isLatestAssistant && !prefersReducedMotion}
                />
              )
            }
            if (content.type === 'image') {
              return (
                <img
                  key={id}
                  src={content.image}
                  alt="fragment"
                  className="mr-2 inline-block w-12 h-12 object-cover rounded-lg bg-white mb-2"
                />
              )
            }
          })}
          {message.object && (
            <div
              onClick={() =>
                setCurrentPreview({
                  fragment: message.object,
                  result: message.result,
                })
              }
              className="py-2 pl-2 w-full md:w-max flex items-center border rounded-xl select-none hover:bg-[var(--surface-subtle)] hover:cursor-pointer"
            >
              <div className="rounded-[0.5rem] w-10 h-10 bg-[var(--surface-subtle)] self-stretch flex items-center justify-center">
                <Terminal strokeWidth={2} className="text-primary" />
              </div>
              <div className="pl-2 pr-4 flex flex-col">
                <span className="font-bold font-sans text-sm text-primary">
                  {message.object.title}
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  Click to see fragment
                </span>
              </div>
            </div>
          )}
        </motion.div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <LoaderIcon strokeWidth={2} className="animate-spin w-4 h-4" />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}
