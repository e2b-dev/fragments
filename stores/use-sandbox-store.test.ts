import { AppError, ErrorCode } from '@/lib/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  selectIsBooting,
  selectPreviewUrl,
  selectSandboxId,
  useSandboxStore,
} from './use-sandbox-store'

const initialState = useSandboxStore.getState()

describe('useSandboxStore', () => {
  beforeEach(() => {
    useSandboxStore.setState(initialState, true)
  })

  it('initializes with idle boot state and null sandboxId/previewUrl', () => {
    const state = useSandboxStore.getState()
    expect(state.sandboxId).toBeNull()
    expect(state.previewUrl).toBeNull()
    expect(state.boot).toEqual({ status: 'idle' })
  })

  it('bootSandbox sets boot to loading', () => {
    useSandboxStore.getState().bootSandbox({ type: 'template' })
    expect(useSandboxStore.getState().boot.status).toBe('loading')
  })

  it('setSandboxReady sets sandboxId, previewUrl, and boot to success', () => {
    useSandboxStore.getState().setSandboxReady('sbx-123', 'https://preview.e2b.dev')
    const state = useSandboxStore.getState()
    expect(state.sandboxId).toBe('sbx-123')
    expect(state.previewUrl).toBe('https://preview.e2b.dev')
    expect(state.boot).toEqual({
      status: 'success',
      data: { sandboxId: 'sbx-123', previewUrl: 'https://preview.e2b.dev' },
    })
  })

  it('setSandboxError sets boot to error state with AppError', () => {
    const error = new AppError({
      code: ErrorCode.SANDBOX_BOOT_FAILED,
      httpStatus: 500,
      userMessage: 'Sandbox failed to boot.',
      message: 'E2B timeout',
    })
    useSandboxStore.getState().setSandboxError(error)
    const boot = useSandboxStore.getState().boot
    expect(boot.status).toBe('error')
    if (boot.status === 'error') {
      expect(boot.error).toBe(error)
      expect(boot.error.code).toBe(ErrorCode.SANDBOX_BOOT_FAILED)
    }
  })

  it('killSandbox resets to idle state', () => {
    useSandboxStore.getState().setSandboxReady('sbx-123', 'https://preview.e2b.dev')
    useSandboxStore.getState().killSandbox()
    const state = useSandboxStore.getState()
    expect(state.sandboxId).toBeNull()
    expect(state.previewUrl).toBeNull()
    expect(state.boot).toEqual({ status: 'idle' })
  })

  it('resetSandbox resets to initial state', () => {
    useSandboxStore.getState().setSandboxReady('sbx-123', 'https://preview.e2b.dev')
    useSandboxStore.getState().resetSandbox()
    const state = useSandboxStore.getState()
    expect(state.sandboxId).toBeNull()
    expect(state.previewUrl).toBeNull()
    expect(state.boot).toEqual({ status: 'idle' })
  })

  describe('selectors', () => {
    it('selectPreviewUrl returns previewUrl', () => {
      expect(selectPreviewUrl(useSandboxStore.getState())).toBeNull()
      useSandboxStore.getState().setSandboxReady('sbx-1', 'https://test.dev')
      expect(selectPreviewUrl(useSandboxStore.getState())).toBe('https://test.dev')
    })

    it('selectIsBooting returns true when boot is loading', () => {
      expect(selectIsBooting(useSandboxStore.getState())).toBe(false)
      useSandboxStore.getState().bootSandbox({ type: 'template' })
      expect(selectIsBooting(useSandboxStore.getState())).toBe(true)
    })

    it('selectSandboxId returns sandboxId', () => {
      expect(selectSandboxId(useSandboxStore.getState())).toBeNull()
      useSandboxStore.getState().setSandboxReady('sbx-42', 'https://test.dev')
      expect(selectSandboxId(useSandboxStore.getState())).toBe('sbx-42')
    })
  })
})
