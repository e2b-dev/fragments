// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let mockPreviewDevice = 'desktop'
const mockSetPreviewDevice = vi.fn()

vi.mock('@/stores/use-ui-store', () => ({
  useUiStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      previewDevice: mockPreviewDevice,
      setPreviewDevice: mockSetPreviewDevice,
    }),
}))

import { DeviceToggle } from './device-toggle'

describe('DeviceToggle', () => {
  beforeEach(() => {
    mockPreviewDevice = 'desktop'
    mockSetPreviewDevice.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders desktop, tablet, and mobile buttons', () => {
    render(<DeviceToggle />)
    expect(screen.getByLabelText('Switch to desktop preview')).toBeDefined()
    expect(screen.getByLabelText('Switch to tablet preview')).toBeDefined()
    expect(screen.getByLabelText('Switch to mobile preview')).toBeDefined()
  })

  it('marks desktop as pressed when active', () => {
    render(<DeviceToggle />)
    expect(screen.getByLabelText('Switch to desktop preview').getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(screen.getByLabelText('Switch to tablet preview').getAttribute('aria-pressed')).toBe(
      'false',
    )
    expect(screen.getByLabelText('Switch to mobile preview').getAttribute('aria-pressed')).toBe(
      'false',
    )
  })

  it('marks tablet as pressed when active', () => {
    mockPreviewDevice = 'tablet'
    render(<DeviceToggle />)
    expect(screen.getByLabelText('Switch to tablet preview').getAttribute('aria-pressed')).toBe(
      'true',
    )
  })

  it('calls setPreviewDevice with tablet on click', () => {
    render(<DeviceToggle />)
    fireEvent.click(screen.getByLabelText('Switch to tablet preview'))
    expect(mockSetPreviewDevice).toHaveBeenCalledWith('tablet')
  })

  it('calls setPreviewDevice with mobile on click', () => {
    render(<DeviceToggle />)
    fireEvent.click(screen.getByLabelText('Switch to mobile preview'))
    expect(mockSetPreviewDevice).toHaveBeenCalledWith('mobile')
  })
})
