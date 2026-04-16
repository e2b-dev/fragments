import { useEffect, useRef, useState } from 'react'

const WORD_INTERVAL_MS = 30

/**
 * Reveals text word-by-word at a steady pace.
 * When `text` grows (streaming chunks), continues from the current position.
 * When `enabled` is false, returns the full text immediately.
 */
export function useTypewriter(text: string, enabled: boolean): string {
  const [wordCount, setWordCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const words = text.split(/(\s+)/)
  const totalTokens = words.length

  useEffect(() => {
    if (!enabled) {
      setWordCount(totalTokens)
      return
    }

    // If we've already revealed everything, wait for more
    if (wordCount >= totalTokens) return

    // Start interval to reveal next words
    timerRef.current = setInterval(() => {
      setWordCount((prev) => {
        if (prev >= totalTokens) {
          if (timerRef.current) clearInterval(timerRef.current)
          return prev
        }
        return prev + 1
      })
    }, WORD_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [enabled, totalTokens, wordCount])

  // Reset when text is cleared (new conversation)
  useEffect(() => {
    if (text === '') {
      setWordCount(0)
    }
  }, [text])

  if (!enabled) return text

  return words.slice(0, wordCount).join('')
}
