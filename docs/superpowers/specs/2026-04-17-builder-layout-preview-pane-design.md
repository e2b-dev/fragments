# Builder Layout & Preview Pane — Design Spec

> Replaces the stashed Story 1.9 implementation. This spec captures the brainstormed design decisions that differ from the original story.

## Summary

Rework the builder layout with a seamless morph transition from landing to builder, a simplified navbar scoped to the chat pane, a 4-state preview pane with code-behind-shimmer, a 3-device toggle, and removal of undo/clear buttons from the nav.

## Design Decisions

### 1. Landing → Builder Morph Transition

The current flow is jarring: landing exits, blank gap, chat pane appears, then preview pane pops in when a fragment loads. Replace with a **seamless morph**:

**Choreography (≈500ms total):**

1. User submits prompt on landing page
2. **Title/subtitle** fade out in place (opacity → 0)
3. **Prompt input** morphs position from center-screen to bottom-left of the chat pane (becomes the chat input). The submitted text appears as a user chat bubble above.
4. **NavBar** morphs from its centered landing position to the left side, scoped above the chat pane column
5. **Preview pane** slides in from the right edge with shimmer (reuses `builderEnterRight` variant direction, may need timing adjustment)
6. All elements arrive together — no sequential pop-in

**Technical approach:** Use `layout` animations from Motion (formerly Framer Motion) for the input and navbar repositioning. The key is that shared elements maintain visual continuity rather than exit/re-enter via `AnimatePresence mode="wait"`.

**What fades/disappears:** Title, subtitle, powered-by logos — simple opacity fade, no position change.

**What persists:** The prompt textarea element itself (morphs to chat input), the navbar container (repositions), the logo (stays).

### 2. NavBar Position: Chat Pane Only

**Decision:** NavBar sits above the chat pane only, not spanning full width.

**Builder layout:**
```
┌──────────────────┬────────────────────────────────┐
│ NavBar           │  Device Toggle                 │
│ Logo  Publish Av │  [Desktop] [Tablet] [Mobile]   │
├──────────────────┤                                │
│                  │                                │
│ Chat messages    │  Preview iframe / shimmer /    │
│                  │  empty state                   │
│                  │                                │
│ Chat input       │                                │
└──────────────────┴────────────────────────────────┘
```

Each column owns its header. Chat pane has logo + actions. Preview pane has its device toolbar.

**NavBar morph:** On landing, the navbar is centered (part of the landing layout). On transition, it animates to its final position — left-aligned, scoped to the chat pane width (400px fixed).

### 3. NavBar Contents — Simplified

**Remove from nav:**
- Undo button
- Clear button
- Redo placeholder
- ThemeToggle (already specified for removal in Story 1.5)

**Keep in nav:**
- Staycy logo (left)
- Publish button placeholder (right, disabled)
- Avatar/profile dropdown (right)

**Downstream impact — Story 3.2 (Undo/Redo):** The original Story 3.2 AC says "a prominent undo button is always visible (replaces the placeholder from Story 1.9)". Since we're no longer placing undo/redo in the navbar, **Story 3.2 needs to decide its own placement** when it's built. Options might include: chat pane toolbar, floating action, keyboard-only (Cmd+Z / Cmd+Shift+Z), or a different UI element. This is a note for the future story author, not a blocker.

### 4. Preview Pane — 4 States

The preview pane renders based on sandbox store state. No code tab. No fragment tab. Just the preview.

| State | Trigger | Display |
|---|---|---|
| **Idle** | No sandbox, not booting | Staycy logomark centered + "Your preview will appear here" |
| **Booting/Generating** | `isBooting === true` or code streaming | Shimmer overlay with faded code streaming behind (see below) |
| **Ready** | `previewUrl` available | Live iframe, device toggle active |
| **Expired** | Sandbox timed out | Staycy logomark + "Reload preview" button (boots new sandbox) |

### 5. Code-Behind-Shimmer Effect

When the LLM is generating code, the preview pane shows:
- **Background layer:** Faded, non-interactive code text streaming in (low opacity ≈0.4, monospace, syntax-colored but muted). Gives ambient "work is happening" feel.
- **Foreground layer:** Semi-transparent shimmer gradient sweeping across, partially obscuring the code.

This replaces the old Code tab entirely. PMs don't need to read code — they just see a visual hint of progress. The code layer uses the actual streamed code from the LLM response, not placeholder text.

**When code isn't streaming** (pure sandbox boot, no LLM output yet): plain shimmer without code background. The code layer only appears when there's actual code to show.

### 6. Device Toggle — 3 Devices

Toolbar at the top of the preview pane with three options:

| Device | Icon | Iframe Width |
|---|---|---|
| **Desktop** | `Monitor` | Full pane width (no constraint) |
| **Tablet** | `Tablet` | 768px centered |
| **Mobile** | `Smartphone` | 430px centered (iPhone 15 Pro Max) |

Active state uses `--onseason-green` indicator. Non-desktop modes center the constrained iframe within the preview pane with a subtle device frame border.

**Store change:** `useUiStore.previewDevice` type changes from `'desktop' | 'mobile'` to `'desktop' | 'tablet' | 'mobile'`.

### 7. Code Tab Removal

The current `components/preview.tsx` has a tabbed interface (Code tab + Preview/Fragment tab) inherited from the Fragments fork. This is removed entirely:

- No tabs in the preview pane
- The `FragmentCode` component is no longer rendered in the builder layout
- The `FragmentPreview` component may be reused internally by the new preview pane for iframe rendering, or replaced
- The old `components/preview.tsx` can be kept for reference but is not rendered

### 8. Desktop-Only Gate

Same as original Story 1.9 — below 1024px viewport, show full-screen message: "Flamingo works best on a larger screen" with Staycy branding. Builder does not render in degraded mode.

### 9. SPA Navigation

Same as original Story 1.9 — no route changes after builder load. External links open in new tabs. Back button returns to Onseason dashboard.

### 10. Returning User Flow

Returning PMs (with existing chat history) skip the landing page and go directly to the builder view:
- Chat pane shows their message history
- Preview pane state depends on sandbox store (auto-boot is Story 1.10's decision, not ours)
- No morph transition needed — builder renders directly

## What This Story Does NOT Do

- **Sandbox boot logic** — Story 1.10 manages `bootSandbox()`, idle timeout, auto-boot on return
- **Chat UI refactor** — Story 1.11 handles message list, streaming, input styling
- **Landing page redesign** — Story 1.12 handles the landing page itself (this story only handles the *transition from* landing)
- **Undo/redo logic or placement** — Story 3.2 decides where undo/redo lives
- **Publish flow** — Story 5.1 wires the publish button
- **Generation pipeline** — Story 2.2 handles LLM → code → sandbox push (but this story's shimmer-with-code will display the streamed code when 2.2 is ready)

## Downstream Stories Affected

### Story 3.2: Undo/Redo via Git Revert
**Impact:** The AC "a prominent undo button is always visible (replaces the placeholder from Story 1.9)" is no longer valid. Undo/redo buttons are not placed by Story 1.9. Story 3.2 must define its own UI placement. Keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) are unaffected.

### Story 1.10: E2B Sandbox Lifecycle
**No impact on contract.** 1.10 still calls `setSandboxReady(id, url)` and the preview pane still reads from `useSandboxStore`. The expired state's "Reload preview" button will need to call `bootSandbox()` from 1.10's API.

### Story 2.2: Generation Pipeline Core
**New opportunity.** The code-behind-shimmer effect needs access to the streamed code output. When 2.2 is built, it should expose the streaming code text (not just the final result) so the preview pane can render it as the faded background. This is a nice-to-have integration point, not a blocker — the shimmer works without code too.

### Story 1.11: Chat UI & Streaming Responses
**No impact.** Chat pane dimensions (400px fixed) are unchanged. Story 1.11 fills the chat column.

### `useUiStore` Type Change
The `previewDevice` type expands from `'desktop' | 'mobile'` to `'desktop' | 'tablet' | 'mobile'`. This is a non-breaking additive change — no downstream consumers exist yet that would break.

## Component Hierarchy (Target)

```
app/page.tsx (builder view)
├── DesktopGate                          # Full-screen block if < 1024px
├── div.flex.h-screen
│   ├── div.w-[400px].shrink-0           # Chat column
│   │   ├── NavBar                       # Logo, Publish, Avatar
│   │   ├── Chat                         # Message list
│   │   └── ChatInput                    # Morphs from landing prompt input
│   └── PreviewPane.flex-1               # Preview column
│       ├── DeviceToggle                 # Desktop / Tablet / Mobile toolbar
│       └── PreviewContent               # iframe / shimmer+code / idle / expired
```

## File Changes (Expected)

```
components/
├── preview/
│   ├── preview-pane.tsx          # NEW or REWRITE — 4-state preview with code-behind-shimmer
│   ├── device-toggle.tsx         # NEW or REWRITE — 3-device toggle (add tablet)
│   └── code-shimmer.tsx          # NEW — faded code background layer for shimmer state
├── builder/
│   └── desktop-gate.tsx          # NEW — desktop-only gate (same as original 1.9)
├── navbar.tsx                    # MODIFIED — remove undo/clear/theme, keep logo/publish/avatar
└── preview.tsx                   # UNCHANGED (legacy, kept for reference, not rendered)

stores/
└── use-ui-store.ts               # MODIFIED — expand previewDevice type to include 'tablet'

lib/chat/
└── transitions.ts                # MODIFIED — add/adjust morph transition variants if needed

app/
└── page.tsx                      # MODIFIED — morph transition, layout refactor, wire stores
```
