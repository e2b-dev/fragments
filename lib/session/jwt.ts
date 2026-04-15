import { SignJWT, jwtVerify } from 'jose'
import type { PMSession } from './types'

/** Pre-encode the secret once at module level for performance */
let _secretKey: Uint8Array | undefined

function getSecretKey(): Uint8Array {
  if (!_secretKey) {
    const secret = process.env.FLAMINGO_SESSION_SECRET
    if (!secret) {
      throw new Error('FLAMINGO_SESSION_SECRET is not configured')
    }
    _secretKey = new TextEncoder().encode(secret)
  }
  return _secretKey
}

/** Reset cached key (for testing only) */
export function _resetSecretKey(): void {
  _secretKey = undefined
}

const JWT_ISSUER = 'flamingo'
const JWT_AUDIENCE = 'flamingo'

export interface VerifyResult {
  valid: true
  session: PMSession
  expiresAt: number
}

export interface VerifyError {
  valid: false
  reason: 'expired' | 'invalid'
}

/** Verify a Flamingo-issued JWT and extract the PMSession */
export async function verifyJwt(token: string): Promise<VerifyResult | VerifyError> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    })

    const session: PMSession = {
      pmId: payload.pmId as string,
      workspaceId: payload.workspaceId as string,
      email: payload.email as string,
      name: payload.name as string,
      image: (payload.image as string | null) ?? null,
      subscriptionStatus: payload.subscriptionStatus as 'active' | 'inactive',
      mode: payload.mode as 'active' | 'preview',
      subdomain: (payload.subdomain as string | null) ?? null,
      customDomain: (payload.customDomain as string | null) ?? null,
      tenantId: (payload.tenantId as string | null) ?? null,
      currency: payload.currency as string,
      impersonatedBy: (payload.impersonatedBy as string | null) ?? null,
      accessToken: payload.accessToken as string,
    }

    // Validate required fields
    if (!session.pmId || !session.workspaceId || !session.email) {
      return { valid: false, reason: 'invalid' }
    }

    return {
      valid: true,
      session,
      expiresAt: payload.exp ?? 0,
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'JWTExpired') {
      return { valid: false, reason: 'expired' }
    }
    return { valid: false, reason: 'invalid' }
  }
}

/** Sign a new Flamingo JWT with the PM session data */
export async function signJwt(session: PMSession, maxAgeSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({
    pmId: session.pmId,
    workspaceId: session.workspaceId,
    email: session.email,
    name: session.name,
    image: session.image,
    subscriptionStatus: session.subscriptionStatus,
    mode: session.mode,
    subdomain: session.subdomain,
    customDomain: session.customDomain,
    tenantId: session.tenantId,
    currency: session.currency,
    impersonatedBy: session.impersonatedBy,
    accessToken: session.accessToken,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + maxAgeSeconds)
    .sign(getSecretKey())
}
