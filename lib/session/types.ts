/** Claims from Onseason's SSO JWT token (snake_case per JWT convention) */
export interface SSOTokenPayload {
  sub: string
  workspace_id: string
  email: string
  name: string
  subscription_status: 'active' | 'inactive'
  mode: 'active' | 'preview'
  subdomain: string | null
  tenant_id: string | null
  currency: string
  jti: string
  iat: number
  exp: number
  iss: 'onseason'
  aud: 'staycy'
}

/** The PM's authenticated session data stored in Flamingo's JWT cookie */
export interface PMSession {
  pmId: string
  workspaceId: string
  email: string
  name: string
  subscriptionStatus: 'active' | 'inactive'
  mode: 'active' | 'preview'
  subdomain: string | null
  tenantId: string | null
  currency: string
}

/** Result of session validation */
export type AuthResult =
  | { authenticated: true; session: PMSession }
  | { authenticated: false; reason: 'no_cookie' | 'expired' | 'invalid' }
