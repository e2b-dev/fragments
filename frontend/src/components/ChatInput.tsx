import { useState, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSubmit, disabled = false, placeholder = "Describe what you want to build..." }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSubmit(input.trim())
      setInput('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 border-t border-gray-200 bg-white">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px] max-h-32"
          rows={1}
          style={{
            height: 'auto',
            minHeight: '44px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      <div className="text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}