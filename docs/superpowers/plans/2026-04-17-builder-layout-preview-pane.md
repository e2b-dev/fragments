# Builder Layout & Preview Pane — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current jarring landing→builder transition and Fragments-fork preview with a seamless morph transition, 4-state preview pane, 3-device toggle, simplified navbar, and desktop-only gate.

**Architecture:** The page layout shifts from `AnimatePresence mode="wait"` (exit-then-enter) to a shared-layout morph using Motion's `layoutId` prop on the prompt input and navbar. The preview pane becomes a standalone component reading from `useSandboxStore` with 4 states (idle, booting/generating, ready, expired). The old tabbed code/fragment preview is removed from the builder layout.

**Tech Stack:** Next.js 14 (App Router), Motion v12 (`motion/react`), Zustand, React 19, Tailwind CSS, Vitest + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-04-17-builder-layout-preview-pane-design.md`

---

## File Structure

```
stores/
└── use-ui-store.ts                  # MODIFY — add 'tablet' to previewDevice type

lib/chat/
└── transitions.ts                   # MODIFY — add previewSlideIn variant for the preview pane entrance

components/
├── builder/
│   └── desktop-gate.tsx             # EXISTS (stashed 1.9) — no changes needed
│   └── desktop-gate.test.tsx        # EXISTS (stashed 1.9) — no changes needed
├── preview/
│   ├── preview-pane.tsx             # EXISTS (stashed 1.9) — REWRITE for 4 states + code-behind-shimmer
│   ├── preview-pane.test.tsx        # EXISTS (stashed 1.9) — REWRITE tests for new states
│   ├── device-toggle.tsx            # EXISTS (stashed 1.9) — MODIFY to add tablet
│   ├── device-toggle.test.tsx       # EXISTS (stashed 1.9) — MODIFY tests for tablet
│   └── code-shimmer.tsx             # NEW — faded code background overlay for shimmer state
├── navbar.tsx                       # MODIFY — remove undo/clear/theme, simplify props
├── landing-hero.tsx                 # MODIFY — add layoutId wrapper on prompt form area

app/
└── page.tsx                         # MODIFY — morph transition, flex layout, wire preview pane
```

---

## Task 1: Expand `previewDevice` Type to Include Tablet

**Files:**
- Modify: `stores/use-ui-store.ts`

- [ ] **Step 1: Update the UiState type**

In `stores/use-ui-store.ts`, change the `previewDevice` type from `'desktop' | 'mobile'` to `'desktop' | 'tablet' | 'mobile'` in three places:

```typescript
// UiState interface (line 7)
export interface UiState {
  previewDevice: 'desktop' | 'tablet' | 'mobile'
  isBelowMinWidth: boolean
  chatInputFocused: boolean
}

// UiActions interface (line 14)
export interface UiActions {
  togglePreviewDevice: () => void
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void
  setIsBelowMinWidth: (below: boolean) => void
  setChatInputFocused: (focused: boolean) => void
}
```

- [ ] **Step 2: Update togglePreviewDevice to cycle through 3 states**

Replace the toggle logic (lines 30-33):

```typescript
togglePreviewDevice: () => {
  set((state) => {
    const cycle = { desktop: 'tablet', tablet: 'mobile', mobile: 'desktop' } as const
    return { previewDevice: cycle[state.previewDevice] }
  })
},
```

- [ ] **Step 3: Add selectIsTabletPreview selector**

After `selectIsMobilePreview` (line 53), add:

```typescript
export const selectIsTabletPreview = (state: UiState & UiActions) =>
  state.previewDevice === 'tablet'
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (no downstream consumers reference the old type yet beyond the stashed preview files)

- [ ] **Step 5: Commit**

```bash
git add stores/use-ui-store.ts
git commit -m "feat: expand previewDevice type to include tablet (desktop/tablet/mobile)"
```

---

## Task 2: Add Preview Slide-In Variant to Transitions

**Files:**
- Modify: `lib/chat/transitions.ts`

- [ ] **Step 1: Add `previewSlideIn` variant pair**

After the `builderEnterRight` / `builderEnterRightReduced` definitions (after line 180), add:

```typescript
// --- Preview Slide In: slides from right edge, 500ms easeOut ---

export const previewSlideIn: MotionVariantSet = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export const previewSlideInReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  transition: INSTANT,
}
```

This differs from `builderEnterRight` (which uses `x: 40` — a fixed 40px nudge) by using `x: '100%'` — a full-width slide from off-screen right.

- [ ] **Step 2: Register in the variants object**

Add to the `variants` object (around line 188):

```typescript
previewSlideIn: { standard: previewSlideIn, reduced: previewSlideInReduced },
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — the `VariantName` type auto-infers from the `variants` object.

- [ ] **Step 4: Commit**

```bash
git add lib/chat/transitions.ts
git commit -m "feat: add previewSlideIn motion variant (full-width slide from right)"
```

---

## Task 3: Update Device Toggle for 3 Devices

**Files:**
- Modify: `components/preview/device-toggle.tsx`
- Modify: `components/preview/device-toggle.test.tsx`

- [ ] **Step 1: Update the device-toggle.test.tsx for tablet**

Replace the full test file content. Tests verify 3 buttons exist, active state reflects selection, and `setPreviewDevice` is called with the correct device:

```typescript
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
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
    expect(screen.getByLabelText('Switch to desktop preview').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText('Switch to tablet preview').getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText('Switch to mobile preview').getAttribute('aria-pressed')).toBe('false')
  })

  it('marks tablet as pressed when active', () => {
    mockPreviewDevice = 'tablet'
    render(<DeviceToggle />)
    expect(screen.getByLabelText('Switch to tablet preview').getAttribute('aria-pressed')).toBe('true')
  })

  it('calls setPreviewDevice with tablet on click', async () => {
    const user = userEvent.setup()
    render(<DeviceToggle />)
    await user.click(screen.getByLabelText('Switch to tablet preview'))
    expect(mockSetPreviewDevice).toHaveBeenCalledWith('tablet')
  })

  it('calls setPreviewDevice with mobile on click', async () => {
    const user = userEvent.setup()
    render(<DeviceToggle />)
    await user.click(screen.getByLabelText('Switch to mobile preview'))
    expect(mockSetPreviewDevice).toHaveBeenCalledWith('mobile')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/preview/device-toggle.test.tsx`
Expected: FAIL — "Switch to tablet preview" label not found (only desktop/mobile exist)

- [ ] **Step 3: Update device-toggle.tsx to add tablet button**

Replace full content of `components/preview/device-toggle.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/use-ui-store'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

const devices = [
  { id: 'desktop', icon: Monitor, label: 'desktop' },
  { id: 'tablet', icon: Tablet, label: 'tablet' },
  { id: 'mobile', icon: Smartphone, label: 'mobile' },
] as const

export function DeviceToggle() {
  const previewDevice = useUiStore((s) => s.previewDevice)
  const setPreviewDevice = useUiStore((s) => s.setPreviewDevice)

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--preview-frame)]">
      {devices.map(({ id, icon: Icon, label }) => (
        <TooltipProvider key={id}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant={previewDevice === id ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewDevice(id)}
                aria-label={`Switch to ${label} preview`}
                aria-pressed={previewDevice === id}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label.charAt(0).toUpperCase() + label.slice(1)} preview</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/preview/device-toggle.test.tsx`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add components/preview/device-toggle.tsx components/preview/device-toggle.test.tsx
git commit -m "feat: add tablet to device toggle (desktop/tablet/mobile)"
```

---

## Task 4: Create Code-Behind-Shimmer Component

**Files:**
- Create: `components/preview/code-shimmer.tsx`

- [ ] **Step 1: Create the component**

This component renders faded, non-interactive code text behind a shimmer overlay. It accepts an optional `code` string — when provided, the code is displayed; when absent, only the shimmer shows.

Write `components/preview/code-shimmer.tsx`:

```typescript
'use client'

import { Shimmer } from '@/components/ui/shimmer'
import { cn } from '@/lib/utils'

interface CodeShimmerProps {
  code?: string | null
  className?: string
}

export function CodeShimmer({ code, className }: CodeShimmerProps) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {code && (
        <div
          className="absolute inset-0 overflow-hidden px-5 py-4 font-mono text-xs leading-relaxed pointer-events-none select-none"
          style={{ opacity: 0.4 }}
          aria-hidden="true"
        >
          <pre className="whitespace-pre-wrap text-[var(--preview-shimmer-to)]">{code}</pre>
        </div>
      )}
      <Shimmer variant={code ? 'overlay' : 'full'} className="absolute inset-0" />
    </div>
  )
}
```

When `code` is provided, the `Shimmer` uses `variant="overlay"` (semi-transparent) so the code shows through. When no code, it uses `variant="full"` (opaque).

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/preview/code-shimmer.tsx
git commit -m "feat: code-shimmer component — faded code behind shimmer overlay"
```

---

## Task 5: Rewrite Preview Pane with 4 States

**Files:**
- Modify: `components/preview/preview-pane.tsx`
- Modify: `components/preview/preview-pane.test.tsx`

- [ ] **Step 1: Write updated tests for 4 states**

Replace `components/preview/preview-pane.test.tsx` with tests covering all 4 states (idle, booting, ready, expired) plus device width constraints including tablet:

```typescript
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

  it('renders expired state when sandbox existed but boot is idle and no URL', () => {
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/preview/preview-pane.test.tsx`
Expected: FAIL — expired state test fails (no reload button), tablet width test fails (no 768px constraint)

- [ ] **Step 3: Rewrite preview-pane.tsx with 4 states**

Replace `components/preview/preview-pane.tsx`:

```typescript
'use client'

import { useSandboxStore } from '@/stores/use-sandbox-store'
import { useUiStore } from '@/stores/use-ui-store'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CodeShimmer } from './code-shimmer'
import { DeviceToggle } from './device-toggle'

interface PreviewPaneProps {
  streamingCode?: string | null
}

const iframeWidthClass: Record<string, string> = {
  desktop: 'h-full w-full',
  tablet: 'h-full max-w-[768px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
  mobile: 'h-full max-w-[430px] w-full mx-auto border border-[var(--preview-frame)] rounded-2xl',
}

export function PreviewPane({ streamingCode }: PreviewPaneProps) {
  const previewUrl = useSandboxStore((s) => s.previewUrl)
  const bootStatus = useSandboxStore((s) => s.boot.status)
  const bootSandbox = useSandboxStore((s) => s.bootSandbox)
  const previewDevice = useUiStore((s) => s.previewDevice)

  const isBooting = bootStatus === 'loading'
  const isExpired = bootStatus === 'error' && !previewUrl

  return (
    <div className="flex h-full flex-col bg-[var(--preview-bg)]">
      <DeviceToggle />
      <div className="relative flex-1 min-h-0">
        {isBooting ? (
          <CodeShimmer code={streamingCode} />
        ) : previewUrl ? (
          <div className="flex h-full items-center justify-center">
            <iframe
              src={previewUrl}
              title="Site preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className={iframeWidthClass[previewDevice] ?? iframeWidthClass.desktop}
            />
          </div>
        ) : isExpired ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
              src="/staycy-only-dark.svg"
              alt="Staycy"
              width={80}
              height={11}
              style={{ width: 80, height: 'auto' }}
              className="opacity-30"
            />
            <Button
              variant="secondary"
              onClick={() => bootSandbox({ type: 'template' })}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload preview
            </Button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
              src="/staycy-only-dark.svg"
              alt="Staycy"
              width={80}
              height={11}
              style={{ width: 80, height: 'auto' }}
              className="opacity-30"
            />
            <p className="text-body text-muted-foreground">Your preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/preview/preview-pane.test.tsx`
Expected: PASS — all 8 tests

- [ ] **Step 5: Run full test suite for regression**

Run: `npx vitest run`
Expected: All existing tests pass

- [ ] **Step 6: Commit**

```bash
git add components/preview/preview-pane.tsx components/preview/preview-pane.test.tsx components/preview/code-shimmer.tsx
git commit -m "feat: 4-state preview pane — idle, booting (code-shimmer), ready, expired"
```

---

## Task 6: Simplify NavBar — Remove Undo/Clear/Theme

**Files:**
- Modify: `components/navbar.tsx`

- [ ] **Step 1: Simplify NavBar props**

Replace the NavBar component's props and the `AuthenticatedControls` component. The navbar now only takes `session`:

```typescript
export function NavBar({ session }: { session: SessionInfo | null }) {
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/staycy-only-dark.svg"
            alt="Staycy"
            width={100}
            height={14}
            style={{ width: 100, height: 'auto' }}
            className="dark:hidden"
            priority
          />
          <Image
            src="/staycy-only-light.svg"
            alt="Staycy"
            width={100}
            height={14}
            style={{ width: 100, height: 'auto' }}
            className="hidden dark:block"
            priority
          />
        </Link>
      </div>

      {session?.impersonatedBy && (
        <div className="flex items-center gap-1.5 mr-4 px-3 py-1 rounded-md bg-[var(--warning-bg)] text-[var(--warning)] text-body-sm font-medium">
          <AlertTriangle className="h-3 w-3" />
          <span>Impersonating as {session.name}</span>
        </div>
      )}

      {session ? (
        <AuthenticatedControls session={session} />
      ) : (
        <UnauthenticatedControls />
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Simplify AuthenticatedControls**

Replace `AuthenticatedControls` — remove undo, clear, and ThemeToggle. Keep publish placeholder (disabled) and profile dropdown:

```typescript
function AuthenticatedControls({ session }: { session: SessionInfo }) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" disabled>
              Publish
            </Button>
          </TooltipTrigger>
          <TooltipContent>Publishing coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ProfileDropdown session={session} />
    </div>
  )
}
```

- [ ] **Step 3: Remove unused imports**

Remove from the import line: `Trash`, `Undo`, `ThemeToggle`. Keep: `AlertTriangle`, `ChevronRight`, `ExternalLink`, `LogOut`.

```typescript
import { AlertTriangle, ChevronRight, ExternalLink, LogOut } from 'lucide-react'
```

Remove the `ThemeToggle` import:
```typescript
// DELETE this line:
// import { ThemeToggle } from '@/components/ui/theme-toggle'
```

- [ ] **Step 4: Run type check and lint**

Run: `npx tsc --noEmit && npx biome check --write components/navbar.tsx`
Expected: PASS — no type errors, formatting clean

- [ ] **Step 5: Commit**

```bash
git add components/navbar.tsx
git commit -m "feat: simplify navbar — remove undo/clear/theme, add publish placeholder

Story 3.2 note: undo/redo buttons removed from navbar. Story 3.2
must decide its own UI placement when built."
```

---

## Task 7: Refactor Page Layout — Morph Transition + Flex Split

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/landing-hero.tsx`

This is the largest task. It replaces `AnimatePresence mode="wait"` with a shared-layout morph using `layoutId`, changes the builder from `grid md:grid-cols-2` to flex with 400px fixed chat + fluid preview, and wires in the new components.

**Morph strategy:** Two elements get `layoutId` for continuous position morphing:
- `layoutId="navbar"` — NavBar wrapper morphs from centered (landing) to left-aligned (builder)
- `layoutId="prompt-input"` — Prompt form area morphs from center-screen to bottom of chat pane

Elements without a `layoutId` target (title, subtitle, powered-by logos) disappear when the landing unmounts. To make this graceful, we wrap them in `AnimatePresence` with exit animations.

- [ ] **Step 1: Update imports in page.tsx**

Add new imports and remove unused ones. At the top of `app/page.tsx`:

```typescript
// ADD these imports:
import { DesktopGate } from '@/components/builder/desktop-gate'
import { PreviewPane } from '@/components/preview/preview-pane'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'

// REMOVE the Preview import:
// import { Preview } from '@/components/preview'
```

Note: `LayoutGroup` is imported from `motion/react` — it coordinates `layoutId` animations across components. Verify this import works with motion v12 (the installed version). If `LayoutGroup` is not available from `motion/react`, fall back to wrapping both states in the same parent and using `layoutId` strings directly without `LayoutGroup`.

- [ ] **Step 2: Remove unused state and handlers**

Remove or comment out these pieces that are no longer used by the builder layout:

```typescript
// Remove currentTab state (line ~41):
// const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')

// Remove handleClearChat if it still exists (check ~line 305-310)
// Remove setCurrentPreview if only used by Preview's onClose
```

Keep `fragment`, `result`, `isPreviewLoading` — they're still used by the `useObject` flow internally. Just don't render the old `Preview` component.

- [ ] **Step 3: Update NavBar call sites**

The NavBar no longer accepts `onClear`, `canClear`, `onUndo`, `canUndo`. Update both call sites:

Landing state NavBar (around line 334):
```typescript
<NavBar session={session} />
```

Builder state NavBar (around line 389):
```typescript
<NavBar session={session} />
```

- [ ] **Step 4: Add layoutId to LandingHero prompt area**

In `components/landing-hero.tsx`, wrap the prompt form section (the `<form>` element and its container, around lines 154-292) in a `motion.div` with `layoutId="prompt-input"`. Also wrap the hero heading (lines 137-151) and powered-by section (lines 295-351) with fade-out capability.

Add `motion` import at top of `landing-hero.tsx` (it's already imported — just verify).

Find the prompt section's `motion.div` wrapper (around line 154) — it currently has stagger animations. Replace it with:

```tsx
<motion.div
  layoutId="prompt-input"
  className="w-full max-w-[700px]"
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {/* existing form content stays the same */}
</motion.div>
```

Wrap the hero heading section (lines 137-151) so it fades independently:

```tsx
<motion.div
  initial={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="text-center"
>
  <h2 className="font-display ...">Direct Booking Websites for the AI Era</h2>
  <p ...>...</p>
</motion.div>
```

Wrap the powered-by section (lines 295-351) similarly with exit fade:

```tsx
<motion.div
  initial={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* powered-by logos content */}
</motion.div>
```

**Important:** The `exit` animations on the hero heading and powered-by sections require that their parent is wrapped in `AnimatePresence`. This is handled in Step 5 from `page.tsx`.

- [ ] **Step 5: Replace the page layout with morph transition**

Replace the main return JSX (lines ~320-451). The key changes:
- Wrap landing-only content in `AnimatePresence` so title/subtitle/powered-by get exit animations
- Use `layoutId` on navbar and prompt-input wrappers for continuous morph
- Preview pane slides in with `previewSlideIn` variant

```tsx
return (
  <DesktopGate>
    <main className="flex min-h-screen max-h-screen">
      <LayoutGroup>
        {isLanding ? (
          /* -- Landing page layout -- */
          <div className="flex flex-col w-full max-h-full overflow-auto">
            <motion.div
              layoutId="navbar"
              className="max-w-[900px] w-full mx-auto px-4"
              transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
            >
              <NavBar session={session} />
            </motion.div>
            <AnimatePresence>
              <LandingHero
                input={chatInput}
                onInputChange={handleSaveInputChange}
                onSubmit={handleSubmitAuth}
                isLoading={isLoading}
                stop={stop}
                isMultiModal={currentModel?.multiModal || false}
                files={files}
                handleFileChange={handleFileChange}
                isErrored={error !== undefined || !!errorMessage}
                errorMessage={errorMessage}
                isRateLimited={isRateLimited}
                retry={retry}
              >
                <ChatPicker
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelectedTemplateChange={setSelectedTemplate}
                  models={filteredModels}
                  languageModel={languageModel}
                  onLanguageModelChange={handleLanguageModelChange}
                />
                <ChatSettings
                  languageModel={languageModel}
                  onLanguageModelChange={handleLanguageModelChange}
                  apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                  baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                  useMorphApply={useMorphApply}
                  onUseMorphApplyChange={setUseMorphApply}
                />
              </LandingHero>
            </AnimatePresence>
          </div>
        ) : (
          /* -- Chat + Preview split layout -- */
          <div className="flex w-full h-full">
            <div className="flex flex-col w-[400px] shrink-0 max-h-screen overflow-hidden">
              <motion.div
                layoutId="navbar"
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
              >
                <NavBar session={session} />
              </motion.div>
              <Chat
                messages={messages}
                isLoading={isLoading}
                setCurrentPreview={setCurrentPreview}
              />
              <motion.div
                layoutId="prompt-input"
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
              >
                <ChatInput
                  retry={retry}
                  isErrored={!errorDismissed && (error !== undefined || !!errorMessage)}
                  errorMessage={errorMessage}
                  isLoading={isLoading}
                  isRateLimited={isRateLimited}
                  onDismissError={() => setErrorDismissed(true)}
                  stop={stop}
                  input={chatInput}
                  handleInputChange={handleSaveInputChange}
                  handleSubmit={handleSubmitAuth}
                  isMultiModal={currentModel?.multiModal || false}
                  files={files}
                  handleFileChange={handleFileChange}
                >
                  <ChatPicker
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onSelectedTemplateChange={setSelectedTemplate}
                    models={filteredModels}
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                  />
                  <ChatSettings
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                    apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                    baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                    useMorphApply={useMorphApply}
                    onUseMorphApplyChange={setUseMorphApply}
                  />
                </ChatInput>
              </motion.div>
            </div>
            <motion.div
              className="flex-1 min-w-0"
              initial={previewSlideVariant.initial}
              animate={previewSlideVariant.animate}
              transition={previewSlideVariant.transition}
            >
              <PreviewPane />
            </motion.div>
          </div>
        )}
      </LayoutGroup>

      <AnimatePresence>
        {showAuthGate && (
          <PromptGateOverlay
            onSignIn={() => {
              const onseasonUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
              const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
              window.location.href = `${onseasonUrl}/api/sso/authorize?client_id=${clientId}&returnTo=${encodeURIComponent('/?resume=true')}`
            }}
            onDismiss={() => setShowAuthGate(false)}
          />
        )}
      </AnimatePresence>
    </main>
  </DesktopGate>
)
```

- [ ] **Step 6: Add the previewSlideVariant variable**

Near the existing variant declarations (around lines 315-318), add:

```typescript
const previewSlideVariant = getVariant('previewSlideIn', prefersReducedMotion)
```

- [ ] **Step 7: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — fix any type errors from removed props or changed imports

- [ ] **Step 8: Run lint and format**

Run: `npx biome check --write app/page.tsx components/landing-hero.tsx`
Expected: Clean output

- [ ] **Step 9: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass. If any page-level tests fail due to changed NavBar props or removed Preview, update them.

- [ ] **Step 10: Commit**

```bash
git add app/page.tsx components/landing-hero.tsx
git commit -m "feat: morph transition from landing to builder + flex split layout

Replace AnimatePresence exit/enter with layoutId morph on navbar and
prompt input. Title/subtitle fade out via exit animations.
Builder uses 400px fixed chat pane + fluid preview pane.
Wire DesktopGate and PreviewPane components."
```

**Polish note:** If `layoutId` morph on the prompt input looks visually jarring due to the dramatic size difference between landing hero form and chat input, fall back to removing the `layoutId="prompt-input"` wrappers and using a simple crossfade instead. The navbar morph alone is already a major improvement. Test visually and iterate.

---

## Task 8: SPA Navigation + History

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add SPA back-button handler**

Inside the `Home()` component, after the existing `useEffect` hooks, add:

```typescript
useEffect(() => {
  if (isLanding) return

  const dashboardUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? '/'

  // Replace history entry so back button goes to Onseason dashboard
  window.history.replaceState(null, '', window.location.pathname)

  function handlePopState() {
    window.location.href = dashboardUrl
  }

  // Push a dummy entry so we can intercept the back button
  window.history.pushState(null, '', window.location.pathname)
  window.addEventListener('popstate', handlePopState)

  return () => window.removeEventListener('popstate', handlePopState)
}, [isLanding])
```

- [ ] **Step 2: Verify no internal `<Link>` navigation in builder**

Check that the `NavBar` logo link doesn't cause a client-side navigation in builder mode. The current logo uses `<Link href="/">` — this is fine because it reloads the same page (SPA behavior). If needed, change to `<a>` with `target="_blank"` in a future pass, but for now it reloads the builder.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: SPA navigation — back button returns to Onseason dashboard"
```

---

## Task 9: Visual Verification + Final Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: PASS — zero errors

- [ ] **Step 2: Run full lint**

Run: `npx biome check --write .`
Expected: Clean

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Start dev server and verify visually**

Run: `npm run dev`

Check at these viewport widths:
- **768px** — should see DesktopGate "Flamingo works best on a larger screen"
- **1024px** — builder renders, chat pane 400px, preview fills remaining 624px
- **1280px** — comfortable split, verify device toggle works
- **1440px** — verify desktop preview fills width

Check preview pane states:
- On load (no sandbox): idle state with "Your preview will appear here"
- Device toggle: clicking Desktop/Tablet/Mobile constrains iframe area

Check transition:
- Type a prompt on landing, submit — navbar should morph from center to left, preview pane should slide in from right
- If `layoutId` morph doesn't work smoothly with the current Motion v12 setup, fall back to the `builderEnterLeft` variant for the chat pane (the existing animation) as a graceful degradation

- [ ] **Step 6: Commit any visual fixes**

```bash
git add -A
git commit -m "fix: visual polish and cleanup from layout verification"
```

---

## Notes for Future Stories

### Story 3.2: Undo/Redo via Git Revert
Undo/redo buttons have been **removed from the navbar**. Story 3.2 AC line "a prominent undo button is always visible (replaces the placeholder from Story 1.9)" is **no longer valid**. Story 3.2 must decide its own placement — options: chat pane toolbar, floating button, keyboard-only (Cmd+Z/Cmd+Shift+Z).

### Story 2.2: Generation Pipeline Core
The `PreviewPane` accepts an optional `streamingCode` prop that feeds the `CodeShimmer` component. When Story 2.2 builds the generation pipeline, pass the LLM's streaming code output to `<PreviewPane streamingCode={currentStreamedCode} />` in `page.tsx` to enable the code-behind-shimmer effect.

### Story 1.10: E2B Sandbox Lifecycle
The expired state's "Reload preview" button calls `bootSandbox({ type: 'template' })`. Story 1.10 implements the actual boot logic — until then, the button sets the store to loading state but nothing happens.
