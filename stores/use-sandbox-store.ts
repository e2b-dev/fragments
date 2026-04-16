'use client'

import type { AppError } from '@/lib/errors'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AsyncState } from './types'
import { asyncIdle } from './types'

export interface SandboxState {
  sandboxId: string | null
  previewUrl: string | null
  boot: AsyncState<{ sandboxId: string; previewUrl: string }>
}

export interface SandboxActions {
  bootSandbox: (source: { type: 'template' } | { type: 'repo'; repoUrl: string }) => void
  setSandboxReady: (sandboxId: string, previewUrl: string) => void
  setSandboxError: (error: AppError) => void
  killSandbox: () => void
  resetSandbox: () => void
}

const initialState: SandboxState = {
  sandboxId: null,
  previewUrl: null,
  boot: asyncIdle(),
}

export const useSandboxStore = create<SandboxState & SandboxActions>()(
  devtools(
    (set) => ({
      ...initialState,

      bootSandbox: (_source) => {
        set({ sandboxId: null, previewUrl: null, boot: { status: 'loading' } })
      },

      setSandboxReady: (sandboxId, previewUrl) => {
        set({
          sandboxId,
          previewUrl,
          boot: { status: 'success', data: { sandboxId, previewUrl } },
        })
      },

      setSandboxError: (error) => {
        set({ boot: { status: 'error', error } })
      },

      killSandbox: () => {
        set({ ...initialState })
      },

      resetSandbox: () => {
        set({ ...initialState })
      },
    }),
    { name: 'SandboxStore', enabled: process.env.NODE_ENV === 'development' },
  ),
)

export const selectPreviewUrl = (state: SandboxState & SandboxActions) => state.previewUrl
export const selectIsBooting = (state: SandboxState & SandboxActions) =>
  state.boot.status === 'loading'
export const selectSandboxId = (state: SandboxState & SandboxActions) => state.sandboxId
