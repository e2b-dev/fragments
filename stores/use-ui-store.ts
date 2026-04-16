'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface UiState {
  previewDevice: 'desktop' | 'tablet' | 'mobile'
  isBelowMinWidth: boolean
  chatInputFocused: boolean
}

export interface UiActions {
  togglePreviewDevice: () => void
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void
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
        set((state) => {
          const cycle = { desktop: 'tablet', tablet: 'mobile', mobile: 'desktop' } as const
          return { previewDevice: cycle[state.previewDevice] }
        })
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
export const selectIsTabletPreview = (state: UiState & UiActions) =>
  state.previewDevice === 'tablet'
export const selectIsBelowMinWidth = (state: UiState & UiActions) => state.isBelowMinWidth
