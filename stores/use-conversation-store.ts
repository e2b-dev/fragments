'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AsyncState } from './types'
import { asyncIdle } from './types'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  commitSha?: string
  filesChanged?: string[]
  changeSummary?: string
}

export interface ConversationState {
  conversationId: string | null
  messages: Message[]
  streaming: AsyncState<void>
  historyLoad: AsyncState<void>
}

export interface ConversationActions {
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setStreaming: (state: AsyncState<void>) => void
  setHistoryLoad: (state: AsyncState<void>) => void
  setConversationId: (id: string) => void
  clearConversation: () => void
}

const initialState: ConversationState = {
  conversationId: null,
  messages: [],
  streaming: asyncIdle(),
  historyLoad: asyncIdle(),
}

export const useConversationStore = create<ConversationState & ConversationActions>()(
  devtools(
    (set) => ({
      ...initialState,

      addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }))
      },

      setMessages: (messages) => {
        set({ messages })
      },

      setStreaming: (streaming) => {
        set({ streaming })
      },

      setHistoryLoad: (state) => {
        set({ historyLoad: state })
      },

      setConversationId: (id) => {
        set({ conversationId: id })
      },

      clearConversation: () => {
        set({ ...initialState })
      },
    }),
    { name: 'ConversationStore', enabled: process.env.NODE_ENV === 'development' },
  ),
)

export const selectMessages = (state: ConversationState & ConversationActions) => state.messages
export const selectIsStreaming = (state: ConversationState & ConversationActions) =>
  state.streaming.status === 'loading'
export const selectConversationId = (state: ConversationState & ConversationActions) =>
  state.conversationId
