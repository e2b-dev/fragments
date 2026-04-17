// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the stores before importing the component
vi.mock('@/stores/use-ui-store', () => {
  const store = {
    isBelowMinWidth: false,
    setIsBelowMinWidth: vi.fn(),
  }
  return {
    useUiStore: (selector: (s: typeof store) => unknown) => selector(store),
    __mockStore: store,
  }
})

// Mock next/image to a simple img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, alt, ...rest } = props
    // biome-ignore lint/a11y/useAltText: test mock — alt is forwarded from props
    return <img alt={(alt as string) ?? ''} {...rest} />
  },
}))

// Mock motion/react to render children without animations
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock animation variants
vi.mock('@/lib/chat', () => ({
  getVariant: () => ({ initial: {}, animate: {}, exit: {}, transition: {} }),
}))

// Mock useReducedMotion
vi.mock('@/components/motion-provider', () => ({
  useReducedMotion: () => false,
}))

import { DesktopGate } from './desktop-gate'

// Access mock store internals
const getMockStore = async () => {
  const mod = await import('@/stores/use-ui-store')
  return (
    mod as unknown as {
      __mockStore: { isBelowMinWidth: boolean; setIsBelowMinWidth: ReturnType<typeof vi.fn> }
    }
  ).__mockStore
}

describe('DesktopGate', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>
  let mockStore: Awaited<ReturnType<typeof getMockStore>>

  beforeEach(async () => {
    mockStore = await getMockStore()
    mockStore.isBelowMinWidth = false
    mockStore.setIsBelowMinWidth.mockClear()

    mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    window.matchMedia = mockMatchMedia as (query: string) => MediaQueryList
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('always renders children', () => {
    render(
      <DesktopGate>
        <div data-testid="builder-content">Builder</div>
      </DesktopGate>,
    )
    expect(screen.getByTestId('builder-content')).toBeDefined()
  })

  it('renders children even when below minimum width', () => {
    mockStore.isBelowMinWidth = true
    render(
      <DesktopGate>
        <div data-testid="builder-content">Builder</div>
      </DesktopGate>,
    )
    expect(screen.getByTestId('builder-content')).toBeDefined()
  })

  it('shows the modal when below minimum width', () => {
    mockStore.isBelowMinWidth = true
    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    expect(screen.getByText('Works best on a larger screen')).toBeDefined()
    expect(screen.getByText('Continue anyway')).toBeDefined()
  })

  it('does not show the modal when above minimum width', () => {
    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    expect(screen.queryByText('Works best on a larger screen')).toBeNull()
  })

  it('dismisses the modal when the close button is clicked', () => {
    mockStore.isBelowMinWidth = true
    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Works best on a larger screen')).toBeNull()
  })

  it('dismisses the modal when "Continue anyway" is clicked', () => {
    mockStore.isBelowMinWidth = true
    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    fireEvent.click(screen.getByText('Continue anyway'))
    expect(screen.queryByText('Works best on a larger screen')).toBeNull()
  })

  it('calls setIsBelowMinWidth based on matchMedia', () => {
    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
    expect(mockStore.setIsBelowMinWidth).toHaveBeenCalledWith(false)
  })

  it('calls setIsBelowMinWidth(true) when viewport is narrow', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )
    expect(mockStore.setIsBelowMinWidth).toHaveBeenCalledWith(true)
  })

  it('registers and cleans up matchMedia listener', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: addListener,
      removeEventListener: removeListener,
    })

    const { unmount } = render(
      <DesktopGate>
        <div>Builder</div>
      </DesktopGate>,
    )

    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
