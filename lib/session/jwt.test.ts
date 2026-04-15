import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _resetSecretKey, signJwt, verifyJwt } from './jwt'
import type { PMSession } from './types'

const TEST_SECRET = 'test-secret-key-that-is-at-least-32-chars-long!'
const SECRET_KEY = new TextEncoder().encode(TEST_SECRET)

const validSession: PMSession = {
  pmId: 'user-123',
  workspaceId: 'ws-456',
  email: 'pm@example.com',
  name: 'Test PM',
  subscriptionStatus: 'active',
  mode: 'active',
  subdomain: 'test-villa',
  tenantId: 'tenant-789',
  currency: 'EUR',
}

describe('jwt', () => {
  beforeEach(() => {
    _resetSecretKey()
    vi.stubEnv('ONSEASON_SSO_SECRET', TEST_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetSecretKey()
  })

  describe('signJwt + verifyJwt roundtrip', () => {
    it('should sign and verify a valid token', async () => {
      const token = await signJwt(validSession, 3600)
      const result = await verifyJwt(token)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.session).toEqual(validSession)
        expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
      }
    })

    it('should include all session fields in the token', async () => {
      const token = await signJwt(validSession, 3600)
      const result = await verifyJwt(token)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.session.pmId).toBe('user-123')
        expect(result.session.workspaceId).toBe('ws-456')
        expect(result.session.email).toBe('pm@example.com')
        expect(result.session.name).toBe('Test PM')
        expect(result.session.subscriptionStatus).toBe('active')
        expect(result.session.mode).toBe('active')
        expect(result.session.subdomain).toBe('test-villa')
        expect(result.session.tenantId).toBe('tenant-789')
        expect(result.session.currency).toBe('EUR')
      }
    })

    it('should handle null optional fields', async () => {
      const session: PMSession = {
        ...validSession,
        subdomain: null,
        tenantId: null,
      }
      const token = await signJwt(session, 3600)
      const result = await verifyJwt(token)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.session.subdomain).toBeNull()
        expect(result.session.tenantId).toBeNull()
      }
    })
  })

  describe('verifyJwt — expired token', () => {
    it('should reject an expired token', async () => {
      const token = await signJwt(validSession, -10) // expired 10 seconds ago
      const result = await verifyJwt(token)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('expired')
      }
    })
  })

  describe('verifyJwt — wrong secret', () => {
    it('should reject a token signed with a different secret', async () => {
      const wrongKey = new TextEncoder().encode('wrong-secret-that-is-also-at-least-32-chars!')
      const token = await new SignJWT({ pmId: 'user-123', workspaceId: 'ws-456', email: 'a@b.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('flamingo')
        .setAudience('staycy')
        .setExpirationTime('1h')
        .sign(wrongKey)

      const result = await verifyJwt(token)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })
  })

  describe('verifyJwt — malformed token', () => {
    it('should reject a non-JWT string', async () => {
      const result = await verifyJwt('not-a-jwt-token')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })

    it('should reject an empty string', async () => {
      const result = await verifyJwt('')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })
  })

  describe('verifyJwt — missing required claims', () => {
    it('should reject a token missing pmId', async () => {
      const token = await new SignJWT({
        workspaceId: 'ws-456',
        email: 'a@b.com',
        name: 'Test',
        subscriptionStatus: 'active',
        mode: 'active',
        currency: 'EUR',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('flamingo')
        .setAudience('staycy')
        .setExpirationTime('1h')
        .sign(SECRET_KEY)

      const result = await verifyJwt(token)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })
  })

  describe('verifyJwt — wrong issuer/audience', () => {
    it('should reject a token with wrong issuer', async () => {
      const token = await new SignJWT({ pmId: 'user-123', workspaceId: 'ws-456', email: 'a@b.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('not-flamingo')
        .setAudience('staycy')
        .setExpirationTime('1h')
        .sign(SECRET_KEY)

      const result = await verifyJwt(token)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })

    it('should reject a token with wrong audience', async () => {
      const token = await new SignJWT({ pmId: 'user-123', workspaceId: 'ws-456', email: 'a@b.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('flamingo')
        .setAudience('not-staycy')
        .setExpirationTime('1h')
        .sign(SECRET_KEY)

      const result = await verifyJwt(token)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })
  })

  describe('signJwt', () => {
    it('should throw if ONSEASON_SSO_SECRET is not set', async () => {
      _resetSecretKey()
      vi.stubEnv('ONSEASON_SSO_SECRET', '')

      await expect(signJwt(validSession, 3600)).rejects.toThrow(
        'ONSEASON_SSO_SECRET is not configured',
      )
    })
  })
})
