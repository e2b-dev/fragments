import { AppError, ErrorCode } from '@/lib/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AsyncState } from './types'
import {
  selectConversationId,
  selectIsStreaming,
  selectMessages,
  useConversationStore,
} from './use-conversation-store'
import type { Message } from './use-conversation-store'

const initialState = useConversationStore.getState()

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  role: 'user',
  content: 'Hello',
  createdAt: '2026-04-16T12:00:00.000Z',
  ...overrides,
})

describe('useConversationStore', () => {
  beforeEach(() => {
    useConversationStore.setState(initialState, true)
  })

  it('initializes with empty messages, null conversationId, idle states', () => {
    const state = useConversationStore.getState()
    expect(state.conversationId).toBeNull()
    expect(state.messages).toEqual([])
    expect(state.streaming).toEqual({ status: 'idle' })
    expect(state.historyLoad).toEqual({ status: 'idle' })
  })

  it('addMessage appends to messages array', () => {
    const msg = makeMessage()
    useConversationStore.getState().addMessage(msg)
    expect(useConversationStore.getState().messages).toEqual([msg])

    const msg2 = makeMessage({ id: 'msg-2', content: 'World' })
    useConversationStore.getState().addMessage(msg2)
    expect(useConversationStore.getState().messages).toEqual([msg, msg2])
  })

  it('setMessages replaces messages array', () => {
    useConversationStore.getState().addMessage(makeMessage())
    const newMessages = [
      makeMessage({ id: 'msg-10', content: 'History 1' }),
      makeMessage({ id: 'msg-11', content: 'History 2' }),
    ]
    useConversationStore.getState().setMessages(newMessages)
    expect(useConversationStore.getState().messages).toEqual(newMessages)
  })

  it('setConversationId sets the id', () => {
    useConversationStore.getState().setConversationId('conv-abc')
    expect(useConversationStore.getState().conversationId).toBe('conv-abc')
  })

  it('setStreaming transitions status correctly', () => {
    useConversationStore.getState().setStreaming({ status: 'loading' })
    expect(useConversationStore.getState().streaming.status).toBe('loading')

    useConversationStore
      .getState()
      .setStreaming({ status: 'success', data: undefined } as AsyncState<void>)
    expect(useConversationStore.getState().streaming.status).toBe('success')

    useConversationStore.getState().setStreaming({ status: 'idle' })
    expect(useConversationStore.getState().streaming.status).toBe('idle')
  })

  it('setStreaming can represent error state', () => {
    const error = new AppError({
      code: ErrorCode.GENERATION_FAILED,
      httpStatus: 500,
      userMessage: 'Stream failed.',
      message: 'stream error',
    })
    useConversationStore.getState().setStreaming({ status: 'error', error })
    const streaming = useConversationStore.getState().streaming
    expect(streaming.status).toBe('error')
    if (streaming.status === 'error') {
      expect(streaming.error).toBe(error)
    }
  })

  it('setHistoryLoad sets state directly', () => {
    useConversationStore.getState().setHistoryLoad({ status: 'loading' })
    expect(useConversationStore.getState().historyLoad.status).toBe('loading')

    useConversationStore
      .getState()
      .setHistoryLoad({ status: 'success', data: undefined } as typeof initialState.historyLoad)
    expect(useConversationStore.getState().historyLoad.status).toBe('success')
  })

  it('clearConversation resets all state', () => {
    useConversationStore.getState().addMessage(makeMessage())
    useConversationStore.getState().setConversationId('conv-1')
    useConversationStore.getState().setStreaming({ status: 'loading' })
    useConversationStore.getState().clearConversation()

    const state = useConversationStore.getState()
    expect(state.conversationId).toBeNull()
    expect(state.messages).toEqual([])
    expect(state.streaming).toEqual({ status: 'idle' })
    expect(state.historyLoad).toEqual({ status: 'idle' })
  })

  describe('selectors', () => {
    it('selectMessages returns messages', () => {
      expect(selectMessages(useConversationStore.getState())).toEqual([])
      useConversationStore.getState().addMessage(makeMessage())
      expect(selectMessages(useConversationStore.getState())).toHaveLength(1)
    })

    it('selectIsStreaming returns true when streaming is loading', () => {
      expect(selectIsStreaming(useConversationStore.getState())).toBe(false)
      useConversationStore.getState().setStreaming({ status: 'loading' })
      expect(selectIsStreaming(useConversationStore.getState())).toBe(true)
    })

    it('selectConversationId returns conversationId', () => {
      expect(selectConversationId(useConversationStore.getState())).toBeNull()
      useConversationStore.getState().setConversationId('conv-xyz')
      expect(selectConversationId(useConversationStore.getState())).toBe('conv-xyz')
    })
  })
})
