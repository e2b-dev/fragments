export type CodeSelectionResult = {
  text: string
  truncated: boolean
  error?: string
}

export function readSelectionInsideElement(params: {
  container: HTMLElement | null
  maxChars?: number
}): CodeSelectionResult | null {
  const { container, maxChars = 8000 } = params
  if (!container) return null

  const sel = window.getSelection()
  if (!sel) return null

  const raw = sel.toString() || ''
  const text = raw.trim()

  if (!text) return null

  const anchorNode = sel.anchorNode
  const focusNode = sel.focusNode
  if (!anchorNode || !focusNode) return null

  // ensure selection is inside container (pre/code area)
  const isInside =
    container.contains(anchorNode as Node) && container.contains(focusNode as Node)

  if (!isInside) return null

  if (text.length > maxChars) {
    return {
      text: text.slice(0, maxChars),
      truncated: true,
      error: `Selection is too large. It was truncated to ${maxChars} characters.`,
    }
  }

  return { text, truncated: false }
}
