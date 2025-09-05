import { useState, useCallback } from 'react'
import type { 
  ChatMessage, 
  Fragment, 
  GenerateResponse, 
  ModelId, 
  TemplateId 
} from '../types'
import { sendChatMessage, ApiError } from '../utils/api'

interface UseChatState {
  sessionId: string | null
  messages: ChatMessage[]
  fragments: Fragment[]
  currentFragment: Fragment | null
  currentResult: GenerateResponse | null
  isLoading: boolean
  error: string | null
}

export function useChat() {
  const [state, setState] = useState<UseChatState>({
    sessionId: null,
    messages: [],
    fragments: [],
    currentFragment: null,
    currentResult: null,
    isLoading: false,
    error: null,
  })

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }, [])

  const sendMessage = useCallback(async (
    message: string,
    model: ModelId = 'gpt-4o',
    template: TemplateId = 'nextjs-developer'
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }
    addMessage(userMessage)

    try {
      const response = await sendChatMessage({
        sessionId: state.sessionId || undefined,
        message,
        model,
        template,
      })

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Generated: ${response.title} - ${response.description}`,
        timestamp: Date.now(),
      }
      addMessage(assistantMessage)

      // Create fragment from response (we'll need to get this from session API in real app)
      const fragment: Fragment = {
        commentary: `Generated ${response.title}`,
        template: template,
        title: response.title,
        description: response.description,
        additional_dependencies: [],
        has_additional_dependencies: false,
        install_dependencies_command: '',
        port: 3000, // Default for most templates
        file_path: 'index.tsx',
        code: `// Generated code for: ${response.title}\n// ${response.description}`,
      }

      setState(prev => ({
        ...prev,
        sessionId: response.sessionId || prev.sessionId,
        fragments: [...prev.fragments, fragment],
        currentFragment: fragment,
        currentResult: response,
        isLoading: false,
      }))

      return response
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'An unexpected error occurred'
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }))
      throw error
    }
  }, [state.sessionId, addMessage])

  const clearChat = useCallback(() => {
    setState({
      sessionId: null,
      messages: [],
      fragments: [],
      currentFragment: null,
      currentResult: null,
      isLoading: false,
      error: null,
    })
  }, [])

  const setCurrentFragment = useCallback((fragment: Fragment, result?: GenerateResponse) => {
    setState(prev => ({
      ...prev,
      currentFragment: fragment,
      currentResult: result || prev.currentResult,
    }))
  }, [])

  return {
    ...state,
    sendMessage,
    addMessage,
    clearChat,
    setCurrentFragment,
  }
}