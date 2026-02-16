import { FragmentSchema } from './schema'
import { ExecutionResult } from './types'
import { DeepPartial } from 'ai'

const MENTION_PATTERN = /@\[(.*?)\]\((.*?)\)/g
const ENCODED_REFERENCE_PREFIX = 'enc:'
const INVALID_REFERENCE_FALLBACK = '[invalid-reference]'

export type MessageText = {
  type: 'text'
  text: string
}

export type MessageCode = {
  type: 'code'
  text: string
}

export type MessageImage = {
  type: 'image'
  image: string
}

export type Message = {
  role: 'assistant' | 'user'
  content: Array<MessageText | MessageCode | MessageImage>
  object?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
}

export type MentionSegment =
  | { type: 'text'; text: string }
  | {
      type: 'mention'
      raw: string
      display: string
      encodedId: string
      decodedId: string
    }

export function encodeReferenceId(id: string): string {
  if (id.startsWith(ENCODED_REFERENCE_PREFIX)) {
    return id
  }

  const encoded = encodeURIComponent(id)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')

  return `${ENCODED_REFERENCE_PREFIX}${encoded}`
}

export function decodeReferenceId(encodedId: string): string {
  if (!encodedId.startsWith(ENCODED_REFERENCE_PREFIX)) {
    return INVALID_REFERENCE_FALLBACK
  }

  const encodedPayload = encodedId.slice(ENCODED_REFERENCE_PREFIX.length)
  if (encodedPayload.length === 0) {
    return ''
  }

  let value = encodedPayload
  const maxDecodePasses = 3

  for (let pass = 0; pass < maxDecodePasses; pass += 1) {
    try {
      if (/%(?![0-9a-fA-F]{2})/.test(value)) {
        return pass === 0 ? INVALID_REFERENCE_FALLBACK : value
      }

      if (!/%[0-9a-fA-F]{2}/.test(value)) {
        return value
      }

      const decodedValue = decodeURIComponent(value)
      if (decodedValue === value) {
        return decodedValue
      }
      value = decodedValue
    } catch {
      return INVALID_REFERENCE_FALLBACK
    }
  }

  return value
}

export function parseMentionSegments(text: string): MentionSegment[] {
  const segments: MentionSegment[] = []
  let lastIndex = 0
  const mentionRegex = new RegExp(MENTION_PATTERN.source, 'g')
  let match: RegExpExecArray | null

  while (true) {
    match = mentionRegex.exec(text)
    if (!match) {
      break
    }

    const [raw, display, encodedId] = match
    const mentionStart = match.index

    if (mentionStart > lastIndex) {
      segments.push({
        type: 'text',
        text: text.slice(lastIndex, mentionStart),
      })
    }

    segments.push({
      type: 'mention',
      raw,
      display,
      encodedId,
      decodedId: decodeReferenceId(encodedId),
    })

    lastIndex = mentionStart + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(lastIndex),
    })
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }]
}

export function expandMentionsForModel(text: string): string {
  return parseMentionSegments(text)
    .map((segment) => {
      if (segment.type === 'text') {
        return segment.text
      }

      return `@${segment.display}\n${segment.decodedId}`
    })
    .join('')
}

export function toAISDKMessages(messages: Message[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.map((content) => {
      if (content.type === 'code') {
        return {
          type: 'text',
          text: content.text,
        }
      }

      if (content.type === 'text') {
        return {
          ...content,
          text: expandMentionsForModel(content.text),
        }
      }

      return content
    }),
  }))
}

export async function toMessageImage(files: File[]) {
  if (files.length === 0) {
    return []
  }

  return Promise.all(
    files.map(async (file) => {
      const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
      return `data:${file.type};base64,${base64}`
    }),
  )
}
