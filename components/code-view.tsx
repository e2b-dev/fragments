import './code-theme.css'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import React, { useEffect, useRef, useState } from 'react'
import { useAttachedCode } from '@/lib/attached-code-context'
import { readSelectionInsideElement } from '@/lib/code-selection'
import { CodeSelectionContextMenu } from '@/components/code-selection-context-menu'

type Props = {
  code: string
  lang: string
  filePath?: string
}

export function CodeView({ code, lang, filePath }: Props) {
  const { attach } = useAttachedCode()

  const preRef = useRef<HTMLPreElement | null>(null)

  const [draftSelection, setDraftSelection] = useState<string>('')
  const [selectionNote, setSelectionNote] = useState<string>('')

  // Right-click menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const MAX_CHARS = 8000

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  function refreshSelection() {
    const result = readSelectionInsideElement({
      container: preRef.current,
      maxChars: MAX_CHARS,
    })

    if (!result) {
      setDraftSelection('')
      setSelectionNote('')
      return
    }

    setDraftSelection(result.text)
    setSelectionNote(result.error || (result.truncated ? 'Selection truncated.' : ''))
  }

  function clearSelection() {
    setDraftSelection('')
    setSelectionNote('')
    window.getSelection()?.removeAllRanges()
  }

  function attachSelection() {
    const text = draftSelection.trim()
    if (!text) return

    attach({
      text,
      filePath,
      language: lang,
      truncated: text.length >= MAX_CHARS,
    })

    clearSelection()
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault()

    // Update selection (in case user right-clicked after selecting)
    refreshSelection()

    // Show menu at cursor position
    setMenuPos({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }

  const canAttach = !!draftSelection.trim()

  return (
    <div className="relative">
      {/* ✅ Right-click menu */}
      <CodeSelectionContextMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        canAttach={canAttach}
        onAttach={attachSelection}
        onClear={clearSelection}
        onClose={() => setMenuOpen(false)}
        note={selectionNote || undefined}
      />

      {/* ✅ Top inline actions (same as before) */}
      {canAttach ? (
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={attachSelection}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
          >
            Attach selection
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
          >
            Clear
          </button>

          {selectionNote ? (
            <span className="text-xs opacity-80">{selectionNote}</span>
          ) : null}
        </div>
      ) : null}

      <pre
        ref={preRef}
        onMouseUp={refreshSelection}
        onKeyUp={refreshSelection}
        onContextMenu={onContextMenu}
        className="p-4 pt-2"
        style={{
          fontSize: 12,
          backgroundColor: 'transparent',
          borderRadius: 0,
          margin: 0,
        }}
      >
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </div>
  )
}
