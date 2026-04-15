import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from './auth'
import { COOKIE_NAME } from './cookie'
import { _resetSecretKey, signJwt } from './jwt'
import type { PMSession } from './types'

const TEST_SECRET = 'test-secret-key-that-is-at-least-32-chars-long!'

const validSession: PMSession = {
  pmId: 'user-123',
  workspaceId: 'ws-456',
  email: 'pm@example.com',
  name: 'Test PM',
  image: null,
  subscriptionStatus: 'active',
  mode: 'active',
  subdomain: 'test-villa',
  customDomain: null,
  tenantId: 'tenant-789',
  currency: 'EUR',
  impersonatedBy: null,
  accessToken: 'mock-access-token',
}

function createRequest(cookieValue?: string): NextRequest {
  const url = 'http://localhost:3000/api/chat'
  const req = new NextRequest(url)
  if (cookieValue) {
    req.cookies.set(COOKIE_NAME, cookieValue)
  }
  return req
}

describe('getSession', () => {
  beforeEach(() => {
    _resetSecretKey()
    vi.stubEnv('FLAMINGO_SESSION_SECRET', TEST_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetSecretKey()
  })

  it('should return authenticated session for valid cookie', async () => {
    const token = await signJwt(validSession, 3600)
    const request = createRequest(token)

    const result = await getSession(request)

    expect(result.authenticated).toBe(true)
    if (result.authenticated) {
      expect(result.session.pmId).toBe('user-123')
      expect(result.session.workspaceId).toBe('ws-456')
      expect(result.session.email).toBe('pm@example.com')
    }
  })

  it('should return no_cookie when cookie is missing', async () => {
    const request = createRequest()

    const result = await getSession(request)

    expect(result.authenticated).toBe(false)
    if (!result.authenticated) {
      expect(result.reason).toBe('no_cookie')
    }
  })

  it('should return expired for expired cookie', async () => {
    const token = await signJwt(validSession, -10)
    const request = createRequest(token)

    const result = await getSession(request)

    expect(result.authenticated).toBe(false)
    if (!result.authenticated) {
      expect(result.reason).toBe('expired')
    }
  })

  it('should return invalid for malformed cookie', async () => {
    const request = createRequest('not-a-valid-jwt')

    const result = await getSession(request)

    expect(result.authenticated).toBe(false)
    if (!result.authenticated) {
      expect(result.reason).toBe('invalid')
    }
  })
})
