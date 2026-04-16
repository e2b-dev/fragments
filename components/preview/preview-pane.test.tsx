// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let mockPreviewUrl: string | null = null
let mockBootStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle'
let mockPreviewDevice = 'desktop'
let mockSandboxId: string | null = null

vi.mock('@/stores/use-sandbox-store', () => ({
  useSandboxStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      previewUrl: mockPreviewUrl,
      sandboxId: mockSandboxId,
      boot: { status: mockBootStatus },
      bootSandbox: vi.fn(),
    }),
}))

vi.mock('@/stores/use-ui-store', () => ({
  useUiStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      previewDevice: mockPreviewDevice,
      setPreviewDevice: vi.fn(),
    }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props
    // biome-ignore lint/a11y/useAltText: mock passes alt via spread
    return <img {...rest} />
  },
}))

import { PreviewPane } from './preview-pane'

describe('PreviewPane', () => {
  beforeEach(() => {
    mockPreviewUrl = null
    mockBootStatus = 'idle'
    mockPreviewDevice = 'desktop'
    mockSandboxId = null
  })

  afterEach(() => {
    cleanup()
  })

  it('renders idle state when no sandbox and not booting', () => {
    render(<PreviewPane />)
    expect(screen.getByText('Your preview will appear here')).toBeDefined()
  })

  it('renders shimmer when sandbox is booting', () => {
    mockBootStatus = 'loading'
    render(<PreviewPane />)
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('renders iframe when preview URL is available', () => {
    mockPreviewUrl = 'https://sandbox.e2b.dev/preview'
    mockBootStatus = 'success'
    render(<PreviewPane />)
    const iframe = document.querySelector('iframe')
    expect(iframe).toBeDefined()
    expect(iframe?.getAttribute('src')).toBe('https://sandbox.e2b.dev/preview')
  })

  it('renders expired state when boot errored and no URL', () => {
    mockSandboxId = null
    mockPreviewUrl = null
    mockBootStatus = 'error'
    render(<PreviewPane />)
    expect(screen.getByRole('button', { name: /reload preview/i })).toBeDefined()
  })

  it('constrains iframe to 430px in mobile mode', () => {
    mockPreviewUrl = 'https://sandbox.e2b.dev/preview'
    mockBootStatus = 'success'
    mockPreviewDevice = 'mobile'
    render(<PreviewPane />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.className).toContain('max-w-[430px]')
  })

  it('constrains iframe to 768px in tablet mode', () => {
    mockPreviewUrl = 'https://sandbox.e2b.dev/preview'
    mockBootStatus = 'success'
    mockPreviewDevice = 'tablet'
    render(<PreviewPane />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.className).toContain('max-w-[768px]')
  })

  it('uses full width in desktop mode', () => {
    mockPreviewUrl = 'https://sandbox.e2b.dev/preview'
    mockBootStatus = 'success'
    mockPreviewDevice = 'desktop'
    render(<PreviewPane />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.className).not.toContain('max-w-')
    expect(iframe?.className).toContain('w-full')
  })

  it('renders device toggle toolbar', () => {
    render(<PreviewPane />)
    expect(screen.getByLabelText('Switch to desktop preview')).toBeDefined()
    expect(screen.getByLabelText('Switch to tablet preview')).toBeDefined()
    expect(screen.getByLabelText('Switch to mobile preview')).toBeDefined()
  })
})
