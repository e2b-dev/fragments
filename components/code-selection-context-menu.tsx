'use client'

import { useEffect, useRef } from 'react'

export function CodeSelectionContextMenu({
  open,
  x,
  y,
  canAttach,
  onAttach,
  onClear,
  onClose,
  note,
}: {
  open: boolean
  x: number
  y: number
  canAttach: boolean
  onAttach: () => void
  onClear: () => void
  onClose: () => void
  note?: string
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    function onMouseDown(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[220px] rounded-xl border bg-background shadow-lg"
      style={{ left: x, top: y }}
      role="menu"
    >
      <div className="p-2">
        <button
          type="button"
          className={`w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted ${
            !canAttach ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => {
            if (!canAttach) return
            onAttach()
            onClose()
          }}
          disabled={!canAttach}
        >
          Attach selection
        </button>

        <button
          type="button"
          className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted"
          onClick={() => {
            onClear()
            onClose()
          }}
        >
          Clear selection
        </button>

        {note ? (
          <div className="mt-2 px-3 pb-1 text-xs text-muted-foreground">
            {note}
          </div>
        ) : null}
      </div>
    </div>
  )
}
