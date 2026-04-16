import type { PublicSession } from '@/lib/session/types'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  selectIsAuthenticated,
  selectIsPublishing,
  selectPendingPrompt,
  selectPmSession,
  selectRateLimitCount,
  useSessionStore,
} from './use-session-store'

const initialState = useSessionStore.getState()

const mockSession: PublicSession = {
  pmId: 'pm-123',
  workspaceId: 'ws-456',
  email: 'pm@example.com',
  name: 'Test PM',
  image: null,
  subscriptionStatus: 'active',
  mode: 'active',
  subdomain: 'test-pm',
  customDomain: null,
  tenantId: 'tenant-1',
  currency: 'USD',
  impersonatedBy: null,
}

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState(initialState, true)
  })

  it('initializes with null session, zero rateLimit, idle publishState, null pendingPrompt', () => {
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.rateLimit).toEqual({ messageCount: 0, limit: 20 })
    expect(state.publishState).toEqual({ status: 'idle' })
    expect(state.pendingPrompt).toBeNull()
  })

  it('setSession stores PublicSession', () => {
    useSessionStore.getState().setSession(mockSession)
    expect(useSessionStore.getState().session).toEqual(mockSession)
  })

  it('clearSession resets all session state', () => {
    useSessionStore.getState().setSession(mockSession)
    useSessionStore.getState().incrementMessageCount()
    useSessionStore.getState().setPendingPrompt('saved prompt')
    useSessionStore.getState().setPublishState({ status: 'loading' })
    useSessionStore.getState().clearSession()

    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.rateLimit).toEqual({ messageCount: 0, limit: 20 })
    expect(state.publishState).toEqual({ status: 'idle' })
    expect(state.pendingPrompt).toBeNull()
  })

  it('incrementMessageCount increments by 1', () => {
    expect(useSessionStore.getState().rateLimit.messageCount).toBe(0)
    useSessionStore.getState().incrementMessageCount()
    expect(useSessionStore.getState().rateLimit.messageCount).toBe(1)
    useSessionStore.getState().incrementMessageCount()
    expect(useSessionStore.getState().rateLimit.messageCount).toBe(2)
  })

  it('setRateLimit replaces rate limit state', () => {
    useSessionStore.getState().setRateLimit({ messageCount: 18, limit: 20 })
    expect(useSessionStore.getState().rateLimit).toEqual({ messageCount: 18, limit: 20 })
  })

  it('setPublishState transitions publish state', () => {
    useSessionStore.getState().setPublishState({ status: 'loading' })
    expect(useSessionStore.getState().publishState.status).toBe('loading')

    useSessionStore
      .getState()
      .setPublishState({ status: 'success', data: { url: 'https://my-site.vercel.app' } })
    const ps = useSessionStore.getState().publishState
    expect(ps.status).toBe('success')
    if (ps.status === 'success') {
      expect(ps.data.url).toBe('https://my-site.vercel.app')
    }
  })

  it('setPendingPrompt stores and clears prompt text', () => {
    useSessionStore.getState().setPendingPrompt('Make the hero darker')
    expect(useSessionStore.getState().pendingPrompt).toBe('Make the hero darker')

    useSessionStore.getState().setPendingPrompt(null)
    expect(useSessionStore.getState().pendingPrompt).toBeNull()
  })

  describe('selectors', () => {
    it('selectPmSession returns session', () => {
      expect(selectPmSession(useSessionStore.getState())).toBeNull()
      useSessionStore.getState().setSession(mockSession)
      expect(selectPmSession(useSessionStore.getState())).toEqual(mockSession)
    })

    it('selectRateLimitCount returns message count', () => {
      expect(selectRateLimitCount(useSessionStore.getState())).toBe(0)
      useSessionStore.getState().incrementMessageCount()
      expect(selectRateLimitCount(useSessionStore.getState())).toBe(1)
    })

    it('selectIsPublishing returns true when publishing', () => {
      expect(selectIsPublishing(useSessionStore.getState())).toBe(false)
      useSessionStore.getState().setPublishState({ status: 'loading' })
      expect(selectIsPublishing(useSessionStore.getState())).toBe(true)
    })

    it('selectIsAuthenticated returns boolean from session presence', () => {
      expect(selectIsAuthenticated(useSessionStore.getState())).toBe(false)
      useSessionStore.getState().setSession(mockSession)
      expect(selectIsAuthenticated(useSessionStore.getState())).toBe(true)
    })

    it('selectPendingPrompt returns pending prompt', () => {
      expect(selectPendingPrompt(useSessionStore.getState())).toBeNull()
      useSessionStore.getState().setPendingPrompt('test prompt')
      expect(selectPendingPrompt(useSessionStore.getState())).toBe('test prompt')
    })
  })
})
