import { beforeEach, describe, expect, it } from 'vitest'
import {
  selectIsBelowMinWidth,
  selectIsMobilePreview,
  selectPreviewDevice,
  useUiStore,
} from './use-ui-store'

const initialState = useUiStore.getState()

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
  })

  it('initializes with desktop previewDevice and false isBelowMinWidth', () => {
    const state = useUiStore.getState()
    expect(state.previewDevice).toBe('desktop')
    expect(state.isBelowMinWidth).toBe(false)
    expect(state.chatInputFocused).toBe(false)
  })

  it('togglePreviewDevice cycles desktop → tablet → mobile → desktop', () => {
    useUiStore.getState().togglePreviewDevice()
    expect(useUiStore.getState().previewDevice).toBe('tablet')

    useUiStore.getState().togglePreviewDevice()
    expect(useUiStore.getState().previewDevice).toBe('mobile')

    useUiStore.getState().togglePreviewDevice()
    expect(useUiStore.getState().previewDevice).toBe('desktop')
  })

  it('setPreviewDevice sets device directly', () => {
    useUiStore.getState().setPreviewDevice('mobile')
    expect(useUiStore.getState().previewDevice).toBe('mobile')

    useUiStore.getState().setPreviewDevice('desktop')
    expect(useUiStore.getState().previewDevice).toBe('desktop')
  })

  it('setIsBelowMinWidth updates correctly', () => {
    useUiStore.getState().setIsBelowMinWidth(true)
    expect(useUiStore.getState().isBelowMinWidth).toBe(true)

    useUiStore.getState().setIsBelowMinWidth(false)
    expect(useUiStore.getState().isBelowMinWidth).toBe(false)
  })

  it('setChatInputFocused updates correctly', () => {
    useUiStore.getState().setChatInputFocused(true)
    expect(useUiStore.getState().chatInputFocused).toBe(true)

    useUiStore.getState().setChatInputFocused(false)
    expect(useUiStore.getState().chatInputFocused).toBe(false)
  })

  describe('selectors', () => {
    it('selectPreviewDevice returns current device', () => {
      expect(selectPreviewDevice(useUiStore.getState())).toBe('desktop')
      useUiStore.getState().setPreviewDevice('mobile')
      expect(selectPreviewDevice(useUiStore.getState())).toBe('mobile')
    })

    it('selectIsMobilePreview returns true when device is mobile', () => {
      expect(selectIsMobilePreview(useUiStore.getState())).toBe(false)
      useUiStore.getState().setPreviewDevice('mobile')
      expect(selectIsMobilePreview(useUiStore.getState())).toBe(true)
    })

    it('selectIsBelowMinWidth returns isBelowMinWidth', () => {
      expect(selectIsBelowMinWidth(useUiStore.getState())).toBe(false)
      useUiStore.getState().setIsBelowMinWidth(true)
      expect(selectIsBelowMinWidth(useUiStore.getState())).toBe(true)
    })
  })
})
