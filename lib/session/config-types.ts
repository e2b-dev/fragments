import { z } from 'zod'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ZEPLCredentials {
  apiKey: string
  apiBase: string
  tenantId: string | null
}

export interface PMFeatureFlags {
  bookingEnabled: boolean
  blogEnabled: boolean
  contactEnabled: boolean
  newsletterEnabled: boolean
  customDomainEnabled: boolean
  maxDailyMessages: number
}

export interface PMConfig {
  zeplCredentials: ZEPLCredentials
  featureFlags: PMFeatureFlags
}

// ---------------------------------------------------------------------------
// Zod schemas — validate the workspace subset of /api/sso/userinfo response
// ---------------------------------------------------------------------------

export const userinfoWorkspaceSchema = z
  .object({
    subscription_status: z.enum(['active', 'inactive']),
    mode: z.enum(['active', 'preview']),
    tenant_id: z.string().nullable(),
    booking_site: z
      .object({
        subdomain: z.string(),
        custom_domain: z.string().nullable(),
        is_published: z.boolean(),
      })
      .nullable(),
  })
  .passthrough()

export const userinfoResponseSchema = z
  .object({
    workspace: userinfoWorkspaceSchema,
  })
  .passthrough()

export type UserinfoWorkspace = z.infer<typeof userinfoWorkspaceSchema>
