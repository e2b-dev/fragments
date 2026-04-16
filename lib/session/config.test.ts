import { AppError, ErrorCode } from '@/lib/errors'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearConfigCache, fetchPMConfig } from './config'
import type { PMSession } from './types'

// ---------------------------------------------------------------------------
// Mock env
// ---------------------------------------------------------------------------

vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    ZEPL_API_KEY: 'test-zepl-key',
    ZEPL_API_BASE: 'https://api.zepl.test',
    ONSEASON_BASE_URL: 'https://onseason.test',
    ONSEASON_SSO_CLIENT_ID: 'flamingo',
  }),
}))

// Suppress logger output in tests
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

function validUserinfoResponse(overrides?: {
  subscription_status?: 'active' | 'inactive'
  tenant_id?: string | null
  booking_site?: { subdomain: string; custom_domain: string | null; is_published: boolean } | null
}) {
  return {
    user: { id: 'user-123', email: 'pm@example.com', name: 'Test PM', image: null },
    workspace: {
      id: 'ws-456',
      name: 'Test Workspace',
      slug: 'test-workspace',
      subscription_status: overrides?.subscription_status ?? 'active',
      mode: 'active' as const,
      tenant_id: overrides?.tenant_id !== undefined ? overrides.tenant_id : 'tenant-789',
      currency: 'EUR',
      branding: { company_name: 'Test Co', company_bio: null },
      contact: { email: 'contact@test.com', phone: null },
      booking_site:
        overrides?.booking_site !== undefined
          ? overrides.booking_site
          : { subdomain: 'test-villa', custom_domain: null, is_published: false },
    },
  }
}

function mockFetchSuccess(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }),
  )
}

function mockFetchStatus(status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error: 'mock error' }),
    }),
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchPMConfig', () => {
  beforeEach(() => {
    clearConfigCache()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 1. Successful assembly
  it('should assemble PMConfig with ZEPL creds from env + session and derived flags', async () => {
    mockFetchSuccess(validUserinfoResponse())

    const config = await fetchPMConfig(validSession)

    expect(config.zeplCredentials).toEqual({
      apiKey: 'test-zepl-key',
      apiBase: 'https://api.zepl.test',
      tenantId: 'tenant-789',
    })
    expect(config.featureFlags.bookingEnabled).toBe(true)
    expect(config.featureFlags.customDomainEnabled).toBe(true)
    expect(config.featureFlags.maxDailyMessages).toBe(50)
  })

  // 2. Malformed userinfo response
  it('should throw CONFIG_INVALID for malformed userinfo response', async () => {
    mockFetchSuccess({ workspace: { bad: 'shape' } })

    await expect(fetchPMConfig(validSession)).rejects.toThrow(AppError)
    await expect(fetchPMConfig(validSession)).rejects.toMatchObject({
      code: ErrorCode.CONFIG_INVALID,
    })
  })

  // 3. Missing workspace fields
  it('should throw CONFIG_INVALID for missing workspace in response', async () => {
    mockFetchSuccess({ user: { id: '1' } })

    await expect(fetchPMConfig(validSession)).rejects.toMatchObject({
      code: ErrorCode.CONFIG_INVALID,
    })
  })

  // 4. Userinfo API unreachable
  it('should throw with user-friendly message when userinfo API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    await expect(fetchPMConfig(validSession)).rejects.toMatchObject({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 502,
      userMessage: 'Unable to load your settings. Please try again.',
    })
  })

  // 5. Userinfo returns 401
  it('should throw UNAUTHORIZED when userinfo returns 401', async () => {
    mockFetchStatus(401)

    await expect(fetchPMConfig(validSession)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
      httpStatus: 401,
    })
  })

  // 6. Cache hit
  it('should return cached config on second call within TTL', async () => {
    mockFetchSuccess(validUserinfoResponse())

    const first = await fetchPMConfig(validSession)
    const second = await fetchPMConfig(validSession)

    expect(first).toBe(second) // same reference
    expect(fetch).toHaveBeenCalledTimes(1) // only one fetch
  })

  // 7. Cache expired
  it('should re-fetch when cache has expired', async () => {
    vi.useFakeTimers({ now: Date.now() })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validUserinfoResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validUserinfoResponse({ subscription_status: 'inactive' })),
      })
    vi.stubGlobal('fetch', fetchMock)

    await fetchPMConfig(validSession)

    // Expire the cache
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    const refreshed = await fetchPMConfig(validSession)

    expect(refreshed.featureFlags.customDomainEnabled).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  // 8. Workspace switch uses different cache entry
  it('should use separate cache entries for different workspaces', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validUserinfoResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validUserinfoResponse({ subscription_status: 'inactive' })),
      })
    vi.stubGlobal('fetch', fetchMock)

    await fetchPMConfig(validSession)

    const otherWorkspaceSession: PMSession = { ...validSession, workspaceId: 'ws-other' }
    const otherConfig = await fetchPMConfig(otherWorkspaceSession)

    expect(otherConfig.featureFlags.customDomainEnabled).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  // 9. Feature flags: tenant_id null -> bookingEnabled false
  it('should derive bookingEnabled=false when tenant_id is null', async () => {
    mockFetchSuccess(validUserinfoResponse({ tenant_id: null }))

    const config = await fetchPMConfig(validSession)

    expect(config.featureFlags.bookingEnabled).toBe(false)
  })

  // 10. Feature flags: subscription_status active -> premium features
  it('should derive premium flags for active subscription', async () => {
    mockFetchSuccess(validUserinfoResponse({ subscription_status: 'active' }))

    const config = await fetchPMConfig(validSession)

    expect(config.featureFlags.customDomainEnabled).toBe(true)
    expect(config.featureFlags.maxDailyMessages).toBe(50)
  })

  // 11. Feature flags: subscription_status inactive -> limited features
  it('should derive limited flags for inactive subscription', async () => {
    mockFetchSuccess(validUserinfoResponse({ subscription_status: 'inactive' }))

    const config = await fetchPMConfig(validSession)

    expect(config.featureFlags.customDomainEnabled).toBe(false)
    expect(config.featureFlags.maxDailyMessages).toBe(20)
  })

  // 12. tenantId from userinfo, not session (D1 patch)
  it('should use tenant_id from userinfo response, not session', async () => {
    const staleSession: PMSession = { ...validSession, tenantId: null }
    mockFetchSuccess(validUserinfoResponse({ tenant_id: 'fresh-tenant' }))

    const config = await fetchPMConfig(staleSession)

    expect(config.zeplCredentials.tenantId).toBe('fresh-tenant')
    expect(config.featureFlags.bookingEnabled).toBe(true)
  })

  // 13. tenantId null in userinfo -> ZEPL credentials tenantId is null
  it('should pass null tenantId when userinfo has no tenant', async () => {
    mockFetchSuccess(validUserinfoResponse({ tenant_id: null }))

    const config = await fetchPMConfig(validSession)

    expect(config.zeplCredentials.tenantId).toBeNull()
    expect(config.featureFlags.bookingEnabled).toBe(false)
  })

  // 14. 403 response -> FORBIDDEN (P5 patch)
  it('should throw FORBIDDEN when userinfo returns 403', async () => {
    mockFetchStatus(403)

    await expect(fetchPMConfig(validSession)).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
      httpStatus: 403,
    })
  })

  // Verify correct URL and headers (no Content-Type on GET — P1 patch)
  it('should call userinfo with correct URL and Bearer token', async () => {
    mockFetchSuccess(validUserinfoResponse())

    await fetchPMConfig(validSession)

    expect(fetch).toHaveBeenCalledWith(
      'https://onseason.test/api/sso/userinfo?client_id=flamingo',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      },
    )
  })
})
