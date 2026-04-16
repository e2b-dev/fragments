import { fetchPMConfig } from './config'
import type { PMConfig } from './config-types'
import type { PMSession } from './types'

/**
 * Convenience wrapper for API routes: fetch (or return cached) PM config.
 *
 * Usage in a route handler:
 * ```ts
 * const session = await requireAuth(request)
 * const config = await requireConfig(session)
 * ```
 */
export async function requireConfig(session: PMSession): Promise<PMConfig> {
  return fetchPMConfig(session)
}
