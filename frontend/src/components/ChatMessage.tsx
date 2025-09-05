import type { ChatMessage as ChatMessageType, Fragment } from '../types'

interface ChatMessageProps {
  message: ChatMessageType
  fragment?: Fragment
  onFragmentClick?: (fragment: Fragment) => void
}

export function ChatMessage({ message, fragment, onFragmentClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 border'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          {timestamp && (
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {timestamp}
            </div>
          )}
        </div>
        
        {/* Show fragment preview for assistant messages */}
        {!isUser && fragment && (
          <div 
            className="mt-2 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onFragmentClick?.(fragment)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-sm">{fragment.title}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {fragment.template}
              </span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {fragment.description}
            </div>
            <div className="text-xs text-gray-500">
              Click to view in preview →
            </div>
          </div>
        )}
      </div>
      
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
        isUser ? 'bg-blue-600 text-white order-1 mr-2' : 'bg-gray-300 text-gray-700 order-2 ml-2'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>
    </div>
  )
}