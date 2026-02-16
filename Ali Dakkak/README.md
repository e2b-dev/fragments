# Fragments – Code Selection → Chat Context Injection (Senior AI Full-Stack Developer Track)

This fork/implementation adds a production-oriented feature to **select code and attach it as chat context** before sending a prompt, with a clear UX and deterministic message injection.

## ✅ What I built

### 1) Code selection → attach as chat context
Users can:
- Select a portion of code from the code viewer.
- Attach that selection as an **explicit “attached context”**.
- Review the attached context **clearly before sending**.
- Clear the current selection.
- Remove the attached context at any time.

### 2) Two UX entry points (both supported)
1) **Inline top action bar** appears when a selection exists:
   - `Attach selection`
   - `Clear`

2) **Right-click context menu** inside the code viewer:
   - `Attach selection`
   - `Clear selection`

### 3) Deterministic injection into the submitted prompt
When an attached selection exists, the user’s message is sent as:

- A structured context block (including file, language, lines placeholder, and the snippet)
- Followed by the user’s typed prompt

This ensures the selection is **always reliably included** when the request is sent.

### 4) Quality / production behavior
- Selection is validated to be **inside the code viewer** (pre/code container).
- Selection is **trimmed**, and large selections are **truncated** with a user note.
- Context panel supports **Expand/Collapse** and **Remove**.
- Context menu closes on outside click and on `Esc`.
- The attached context is cleared after the message is enqueued (to avoid accidental reuse).

---

## 🧱 Implementation overview (Files & Responsibilities)

### Core selection logic
- **`lib/code-selection.ts`**
  - Reads the current browser selection
  - Ensures it belongs to the code viewer container
  - Applies max size limit + truncation note

### Context menu UI
- **`components/code-selection-context-menu.tsx`**
  - Renders a custom right-click menu (Attach / Clear)
  - Handles close behavior (outside click + ESC)

### Code viewer integration
- **`components/code-view.tsx`**
  - Highlights code with Prism
  - Tracks selection state (`draftSelection`)
  - Shows:
    - top inline action bar when selection exists
    - right-click menu always inside code area
  - Attaches selection to global store

### Attached context global store
- **`lib/attached-code-context.tsx`**
  - Holds the attached snippet + metadata:
    - `text`, `filePath`, `language`, `truncated`, etc.
  - Exposes:
    - `attach(...)`, `clear()`, and state `attached`

### Chat input preview panel
- **`components/chat-input.tsx`**
  - Renders an “Attached code context” panel above the textarea
  - Supports Expand/Collapse + Remove
  - Keeps the UX explicit before sending

### Injection into chat request
- **`app/page.tsx`**
  - Wraps app with `AttachedCodeProvider`
  - On submit:
    - Builds a deterministic `ATTACHED_CODE_CONTEXT` block
    - Sends `finalPrompt = contextBlock + userText`
    - Clears attached context after enqueue

---

## 🔧 Setup

### Requirements
- Node.js (works with recent Node versions)
- npm

### Install
```bash
npm install
