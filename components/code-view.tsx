import './code-theme.css'
import Prism from 'prismjs'
import { useCallback, useEffect, useRef, useState } from 'react'

export type CodeSelection = {
  text: string
  start: number
  end: number
  startLine: number
  endLine: number
  fileName?: string
}

function toLineNumber(code: string, charIndex: number) {
  return code.slice(0, charIndex).split('\n').length
}

type CodeViewProps = {
  code: string
  lang: string
  onMention?: (selection: CodeSelection) => void // New event prop
}

export function CodeView({ code, lang, onMention }: CodeViewProps) {
  const codeRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<{
    x: number
    y: number
    data: CodeSelection
  } | null>(null)

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  // Logic to trigger the mention
  const triggerMention = useCallback(() => {
    if (hint && onMention) {
      onMention(hint.data)
      setHint(null) // Hide hint after action
    }
  }, [hint, onMention])

  // Handle Ctrl+I shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        if (hint) {
          e.preventDefault()
          triggerMention()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hint, triggerMention])

  const handleSelection = () => {
    const selection = window.getSelection()
    const container = containerRef.current

    if (
      !selection ||
      selection.toString().trim() === '' ||
      !container ||
      !codeRef.current
    ) {
      setHint(null)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // Calculate offsets
    const preRange = range.cloneRange()
    preRange.selectNodeContents(codeRef.current)
    preRange.setEnd(range.startContainer, range.startOffset)
    const start = preRange.toString().length
    const end = start + selection.toString().length

    setHint({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 35,
      data: {
        text: selection.toString(),
        start,
        end,
        startLine: toLineNumber(code, start),
        endLine: toLineNumber(code, end),
      },
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseUp={handleSelection}
    >
      {hint && (
        <div
          className="absolute z-50 p-1 text-xs bg-gray-700 text-white rounded-md shadow-md whitespace-nowrap  transition-colors"
          style={{
            left: `${hint.x}px`,
            top: `${hint.y}px`,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto', // Changed from 'none' to allow clicking
          }}
        >
          <button
            className="hover:bg-gray-600 rounded-md px-2 py-1 text-xs text-white"
            onClick={(e) => {
              e.stopPropagation()
              triggerMention()
            }}
          >
            Add to Chat (Ctrl+I)
          </button>
        </div>
      )}
      <pre className="p-4 pt-2" style={{ fontSize: 12 }}>
        <code ref={codeRef} className={`language-${lang}`}>
          {code}
        </code>
      </pre>
    </div>
  )
}
