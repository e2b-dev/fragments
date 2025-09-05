import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType, Fragment } from '../types'
import { ChatMessage } from './ChatMessage'

interface ChatHistoryProps {
  messages: ChatMessageType[]
  fragments: Fragment[]
  onFragmentClick?: (fragment: Fragment) => void
  isLoading?: boolean
}

export function ChatHistory({ messages, fragments, onFragmentClick, isLoading = false }: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Map fragments to assistant messages
  const getFragmentForMessage = (message: ChatMessageType, index: number): Fragment | undefined => {
    if (message.role === 'assistant') {
      // Find corresponding fragment - simplified mapping
      const assistantMessageIndex = messages
        .slice(0, index + 1)
        .filter(m => m.role === 'assistant').length - 1
      return fragments[assistantMessageIndex]
    }
    return undefined
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-lg font-medium mb-2">Start a conversation</div>
            <div className="text-sm">
              Describe what you want to build and I'll help you create it
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              fragment={getFragmentForMessage(message, index)}
              onFragmentClick={onFragmentClick}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%]">
                <div className="bg-gray-100 text-gray-900 border px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Generating code...</span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-300 text-gray-700 ml-2">
                AI
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}