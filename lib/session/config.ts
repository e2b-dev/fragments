import { getEnv } from '@/lib/env'
import { AppError, ErrorCode } from '@/lib/errors'
import { logger } from '@/lib/logger'

import type { PMConfig, PMFeatureFlags, UserinfoWorkspace } from './config-types'
import { userinfoResponseSchema } from './config-types'
import type { PMSession } from './types'

// ---------------------------------------------------------------------------
// In-memory cache (module-level — survives across requests in Fluid Compute)
// ---------------------------------------------------------------------------

const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CachedConfig {
  config: PMConfig
  expiresAt: number
}

const configCache = new Map<string, CachedConfig>()

function cacheKey(session: PMSession): string {
  return `${session.pmId}:${session.workspaceId}`
}

/** Clear cache — exported for test use only. Not re-exported from index.ts. */
export function clearConfigCache(): void {
  configCache.clear()
}

// ---------------------------------------------------------------------------
// Feature flag derivation
// ---------------------------------------------------------------------------

function deriveFeatureFlags(workspace: UserinfoWorkspace): PMFeatureFlags {
  return {
    bookingEnabled: workspace.tenant_id !== null,
    blogEnabled: true,
    contactEnabled: true,
    newsletterEnabled: false,
    customDomainEnabled: workspace.subscription_status === 'active',
    maxDailyMessages: workspace.subscription_status === 'active' ? 50 : 20,
  }
}

// ---------------------------------------------------------------------------
// Config fetcher
// ---------------------------------------------------------------------------

/**
 * Assemble PM config from environment variables, session data, and fresh
 * workspace data from Onseason's /api/sso/userinfo endpoint.
 *
 * Results are cached in-memory (5-min TTL, keyed by pmId:workspaceId).
 */
export async function fetchPMConfig(session: PMSession): Promise<PMConfig> {
  // Check cache first
  const key = cacheKey(session)
  const cached = configCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    logger.info('PM config served from cache', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
    })
    return cached.config
  }

  const env = getEnv()
  const endpoint = `${env.ONSEASON_BASE_URL}/api/sso/userinfo?client_id=${env.ONSEASON_SSO_CLIENT_ID}`

  let response: Response
  try {
    response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
  } catch (error: unknown) {
    const appError = new AppError({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 502,
      userMessage: 'Unable to load your settings. Please try again.',
      message: `Userinfo API unreachable: ${endpoint}`,
      cause: error instanceof Error ? error : undefined,
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  if (response.status === 401) {
    const appError = new AppError({
      code: ErrorCode.UNAUTHORIZED,
      httpStatus: 401,
      userMessage: 'Your session has expired. Please sign in again.',
      message: 'Userinfo returned 401 — access token expired or revoked',
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: 'Userinfo HTTP 401',
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  if (response.status === 403) {
    const appError = new AppError({
      code: ErrorCode.FORBIDDEN,
      httpStatus: 403,
      userMessage: 'You do not have access to this workspace. Please contact support.',
      message: 'Userinfo returned 403 — workspace access denied',
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: 'Userinfo HTTP 403',
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  if (!response.ok) {
    const appError = new AppError({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 502,
      userMessage: 'Unable to load your settings. Please try again.',
      message: `Userinfo returned ${response.status}`,
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: `Userinfo HTTP ${response.status}`,
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  // Parse and validate response
  let body: unknown
  try {
    body = await response.json()
  } catch (error: unknown) {
    const appError = new AppError({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 502,
      userMessage: 'Unable to load your settings. Please try again.',
      message: 'Userinfo response is not valid JSON',
      cause: error instanceof Error ? error : undefined,
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: 'Invalid JSON response',
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  const parsed = userinfoResponseSchema.safeParse(body)
  if (!parsed.success) {
    const appError = new AppError({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 502,
      userMessage: 'Unable to load your settings. Please try again.',
      message: 'Userinfo response failed Zod validation',
      details: parsed.error.errors,
    })
    logger.error('PM config assembly failed', {
      subsystem: 'session',
      pmId: session.pmId,
      workspaceId: session.workspaceId,
      error: 'Zod validation failed',
    })
    await appError.report({ pmId: session.pmId, workspaceId: session.workspaceId })
    throw appError
  }

  // Assemble config — use fresh tenant_id from userinfo (not session) to avoid stale data
  const config: PMConfig = {
    zeplCredentials: {
      apiKey: env.ZEPL_API_KEY,
      apiBase: env.ZEPL_API_BASE,
      tenantId: parsed.data.workspace.tenant_id,
    },
    featureFlags: deriveFeatureFlags(parsed.data.workspace),
  }

  // Cache result
  configCache.set(key, {
    config,
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  })

  logger.info('PM config assembled', {
    subsystem: 'session',
    pmId: session.pmId,
    workspaceId: session.workspaceId,
  })

  return config
}
