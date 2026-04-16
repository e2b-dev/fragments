'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface UiState {
  previewDevice: 'desktop' | 'mobile'
  isBelowMinWidth: boolean
  chatInputFocused: boolean
}

export interface UiActions {
  togglePreviewDevice: () => void
  setPreviewDevice: (device: 'desktop' | 'mobile') => void
  setIsBelowMinWidth: (below: boolean) => void
  setChatInputFocused: (focused: boolean) => void
}

const initialState: UiState = {
  previewDevice: 'desktop',
  isBelowMinWidth: false,
  chatInputFocused: false,
}

export const useUiStore = create<UiState & UiActions>()(
  devtools(
    (set) => ({
      ...initialState,

      togglePreviewDevice: () => {
        set((state) => ({
          previewDevice: state.previewDevice === 'desktop' ? 'mobile' : 'desktop',
        }))
      },

      setPreviewDevice: (device) => {
        set({ previewDevice: device })
      },

      setIsBelowMinWidth: (below) => {
        set({ isBelowMinWidth: below })
      },

      setChatInputFocused: (focused) => {
        set({ chatInputFocused: focused })
      },
    }),
    { name: 'UiStore', enabled: process.env.NODE_ENV === 'development' },
  ),
)

export const selectPreviewDevice = (state: UiState & UiActions) => state.previewDevice
export const selectIsMobilePreview = (state: UiState & UiActions) =>
  state.previewDevice === 'mobile'
export const selectIsBelowMinWidth = (state: UiState & UiActions) => state.isBelowMinWidth
