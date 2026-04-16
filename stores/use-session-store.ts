'use client'

import type { PublicSession } from '@/lib/session/types'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AsyncState } from './types'
import { asyncIdle } from './types'

export interface SessionState {
  session: PublicSession | null
  rateLimit: { messageCount: number; limit: number }
  publishState: AsyncState<{ url: string }>
  pendingPrompt: string | null
}

export interface SessionActions {
  setSession: (session: PublicSession) => void
  clearSession: () => void
  incrementMessageCount: () => void
  setRateLimit: (rateLimit: { messageCount: number; limit: number }) => void
  setPublishState: (state: AsyncState<{ url: string }>) => void
  setPendingPrompt: (prompt: string | null) => void
}

const initialState: SessionState = {
  session: null,
  rateLimit: { messageCount: 0, limit: 20 },
  publishState: asyncIdle(),
  pendingPrompt: null,
}

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setSession: (session) => {
        set({ session })
      },

      clearSession: () => {
        set({ ...initialState })
      },

      incrementMessageCount: () => {
        set((state) => ({
          rateLimit: { ...state.rateLimit, messageCount: state.rateLimit.messageCount + 1 },
        }))
      },

      setRateLimit: (rateLimit) => {
        set({ rateLimit })
      },

      setPublishState: (publishState) => {
        set({ publishState })
      },

      setPendingPrompt: (prompt) => {
        set({ pendingPrompt: prompt })
      },
    }),
    { name: 'SessionStore', enabled: process.env.NODE_ENV === 'development' },
  ),
)

export const selectPmSession = (state: SessionState & SessionActions) => state.session
export const selectRateLimitCount = (state: SessionState & SessionActions) =>
  state.rateLimit.messageCount
export const selectIsPublishing = (state: SessionState & SessionActions) =>
  state.publishState.status === 'loading'
export const selectIsAuthenticated = (state: SessionState & SessionActions) =>
  state.session !== null
export const selectPendingPrompt = (state: SessionState & SessionActions) => state.pendingPrompt
