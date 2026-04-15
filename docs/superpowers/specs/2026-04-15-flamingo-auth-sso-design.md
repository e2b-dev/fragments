# Flamingo Auth & SSO Design

> Generalized Onseason SSO with Google-styled auth UI, workspace management, and prompt-gated authentication for the Flamingo Builder.

## Context

Flamingo is the next-generation AI website builder replacing Staycy. User accounts live on Onseason. This design covers:

- Generalizing Onseason's SSO from Staycy-specific to multi-product
- Restyling Onseason auth pages to a unified Google Account-inspired design
- Flamingo's auth flow, session management, workspace picker/switcher, and prompt-gated sign-in

Both Flamingo and Onseason changes are in scope. No backward compatibility with Staycy is needed — Flamingo replaces it, and everything deploys together at launch.

## Architectural Approach

**OAuth-aligned custom SSO (Approach C).** Evolve the existing SSO infrastructure with OAuth 2.0-aligned semantics:

- Opaque authorization codes instead of JWTs in redirect URLs
- Product registry with `client_id` / `client_secret`
- Token exchange returns structured `{ access_token, expires_in, token_type }` response
- Not a full OAuth 2.0 server (no scopes, grant types, PKCE), but close enough that migrating to standard OAuth later is a rename, not a rewrite

**Key improvement over current flow:** Authorization codes in redirect URLs instead of full JWTs — shorter, no sensitive data in browser history/logs, trivial single-use enforcement.

---

## 1. Onseason: Product Registry

### New Table: `sso_products`

| Column | Type | Example (Flamingo) |
|---|---|---|
| `id` | UUID (PK) | auto |
| `clientId` | VARCHAR(100), unique | `flamingo` |
| `clientSecretHash` | VARCHAR(255) | bcrypt of shared secret |
| `displayName` | VARCHAR(255) | `Flamingo` |
| `baseUrl` | VARCHAR(2048) | `https://flamingo.ai` |
| `callbackPath` | VARCHAR(255) | `/api/auth/callback` |
| `audience` | VARCHAR(100) | `flamingo` |
| `active` | BOOLEAN | `true` |
| `createdAt` | TIMESTAMP | auto |
| `updatedAt` | TIMESTAMP | auto |

Managed via database migrations/seeds. No admin UI initially.

### New Table: `sso_authorization_codes`

| Column | Type | Description |
|---|---|---|
| `code` | UUID (PK) | Opaque authorization code |
| `userId` | UUID (FK → users) | Authenticated user |
| `workspaceId` | UUID (FK → workspaces) | Selected workspace |
| `productId` | UUID (FK → sso_products) | Target product |
| `returnTo` | VARCHAR(2048) | Post-auth redirect path |
| `expiresAt` | TIMESTAMP | 5 minutes from creation |
| `usedAt` | TIMESTAMP, nullable | Set on exchange, null = unused |
| `createdAt` | TIMESTAMP | auto |

Single-use enforcement: reject if `usedAt` is not null or `expiresAt` has passed. Cleanup via cron or TTL.

---

## 2. Onseason: Generalized SSO Endpoints

All endpoints are product-aware via `client_id` or Bearer token context.

### `GET /api/sso/authorize`

- **Params:** `client_id` (required), `returnTo` (optional), `workspace_id` (optional)
- **Requires:** Active Onseason session (NextAuth)
- **Flow:**
  1. Validate `client_id` against product registry
  2. If no Onseason session → redirect to login page with product context preserved (`client_id` in query/session)
  3. If session + `workspace_id` provided or user has single workspace → generate auth code, redirect to `{product.baseUrl}{product.callbackPath}?code={code}&returnTo={returnTo}`
  4. If session + multiple workspaces + no `workspace_id` → redirect to Onseason's workspace picker page (Google "Choose an account"-style card, same restyled auth design language). User selects a workspace, picker re-triggers authorize with the selected `workspace_id`, and the flow continues from step 3
- **Admin impersonation:** If admin is impersonating a workspace, the auth code carries the workspace owner's identity with `impersonatedBy` set to the admin's user ID

### `POST /api/sso/token`

- **Body:** `{ client_id, client_secret, code }`
- **Validates:** Client credentials against product registry, code validity (not expired, not used)
- **Marks:** Code as used (`usedAt = now()`)
- **Returns:**
  ```json
  {
    "access_token": "<JWT>",
    "expires_in": 3600,
    "token_type": "Bearer",
    "user": { "id", "email", "name", "image" },
    "workspace": { "id", "name", "subscription_status", "mode", "subdomain", "custom_domain", "tenant_id", "currency" }
  }
  ```
- **JWT claims:** `sub` (workspace owner user ID), `workspace_id`, `email`, `name`, `image`, `subscription_status`, `mode`, `subdomain`, `custom_domain`, `tenant_id`, `currency`, `impersonated_by` (nullable), `iss: "onseason"`, `aud: <product.audience>`, `iat`, `exp` (1 hour), `jti`

### `POST /api/sso/refresh`

- **Headers:** `Authorization: Bearer <JWT>`
- **Body:** `{ client_id }`
- **Returns:** New JWT with fresh workspace data (live DB lookup for subscription status, mode, capabilities) + `{ token, expires_in, subscription_status, mode }`

### `GET /api/sso/userinfo`

- **Headers:** `Authorization: Bearer <JWT>`
- **Returns:** Full user + workspace context including `image` (avatar URL), booking site data (subdomain, custom domain, publish status), branding (company name, bio), contact info

### `GET /api/sso/workspaces` (new)

- **Headers:** `Authorization: Bearer <JWT>`
- **Returns:** Array of user's workspaces with roles:
  ```json
  {
    "workspaces": [
      { "id", "name", "slug", "role", "subscription_status", "mode" }
    ]
  }
  ```

### `GET /api/sso/subscription`

- **Headers:** `Authorization: Bearer <JWT>`
- **Returns:** Live subscription status from database (not cached token claims): `{ subscription_status, mode, workspace_id }`

---

## 3. Onseason: Registration with Product Context

### Registration Endpoint

`POST /api/auth/register` accepts optional `client_id` parameter.

- If `client_id` is present, the `source` field on the verification token is set to the `client_id` value (e.g., `"flamingo"`)
- New users receive an auto-created workspace (existing behavior, carries forward)
- Verification email link: `verify-email?token=<uuid>&source=flamingo`

### Verification Flow

After email verification, the verify-email page checks the `source` parameter:

- If `source` matches a registered product's `client_id`:
  1. Generate authorization code for that product
  2. Redirect to `{product.baseUrl}{product.callbackPath}?code={code}&returnTo=/`
  3. User lands on the product's landing page, authenticated
- If no source or unknown source:
  1. Redirect to Onseason login page (existing behavior)

### Google/Apple OAuth from Product Context

- Current `auth_source=staycy` cookie → generalized to `auth_source=<client_id>`
- `staycy-callback` route renamed to `sso-oauth-callback`
- After OAuth completes, reads `auth_source` cookie, looks up product, redirects through `/api/sso/authorize`

---

## 4. Onseason: Auth UI Redesign

Restyle existing auth pages to a Google Account-inspired centered card design. Keep current field groupings — no multi-step changes.

### Design Language

- Centered card, max-width ~450px, clean background
- Onseason logo at top of card
- Product context line when coming from SSO: "Sign in to continue to **Flamingo**" (derived from product registry `displayName`)
- Minimal chrome — no sidebar, no dashboard nav, just the auth card

### Login Page

- Google / Apple OAuth buttons at top
- Divider ("or")
- Email + password fields
- "Forgot password?" link under password field
- "Create account" link at bottom
- Product context preserved in URL/session for the full flow

### Register Page

- Google / Apple OAuth buttons
- First name, last name, email, password fields
- "Sign in instead" link at bottom
- Carries `client_id` context so verification email knows the source

### Check Your Email Page

- Centered card with envelope icon
- "We sent a verification link to **user@email.com**"
- "Resend email" action

### Verify Email Page

- Brief success state → auto-redirect to product (via auth code) or Onseason login (if no product source)

### Workspace Picker Page (new)

- Shown during SSO authorize flow when user has multiple workspaces and no `workspace_id` was provided
- Google "Choose an account"-style card layout, same design language as other auth pages
- Shows all user's workspaces with name, role badge, subscription status
- Product context line: "Choose a workspace for **Flamingo**"
- After selection → re-triggers `/api/sso/authorize` with selected `workspace_id`

---

## 5. Flamingo: Auth Flow

### 5a. Sign-In Flow (existing user)

1. User clicks "Sign In" on Flamingo landing page
2. Flamingo redirects to Onseason `GET /api/sso/authorize?client_id=flamingo&returnTo=/`
3. Onseason shows restyled login page with "Sign in to continue to Flamingo"
4. User authenticates (email/password or Google/Apple OAuth)
5. Onseason generates opaque auth code (UUID, 5-min TTL, single-use), stores in `sso_authorization_codes`
6. Onseason redirects to `Flamingo /api/auth/callback?code=<uuid>&returnTo=/`
7. Flamingo callback exchanges code server-to-server: `POST Onseason /api/sso/token { client_id, client_secret, code }`
8. Sign Flamingo JWT, set `flamingo_session` httpOnly cookie, redirect to `returnTo`

Note: workspace selection (if the user has multiple) is handled by Onseason's workspace picker during the authorize flow (step 2-3). By the time the auth code reaches Flamingo, a workspace is always selected.

### 5b. Registration Flow (new user from Flamingo)

1. User clicks "Sign In" → Onseason login page → clicks "Create account"
2. Onseason register page (restyled) — knows `source=flamingo` from `client_id` context
3. User fills form, submits
4. Onseason creates user + auto-creates workspace, sends verification email: `verify-email?token=<uuid>&source=flamingo`
5. User lands on "Check your email" screen
6. User clicks email link → Onseason verifies email
7. Onseason generates auth code for Flamingo, redirects to `Flamingo /api/auth/callback?code=<uuid>`
8. Same as sign-in from step 7 onward

### 5c. Prompt-Gated Auth Flow

1. Unauthenticated user types a prompt on the landing page, hits enter
2. Client checks auth state — no session cookie
3. Prompt is saved to `sessionStorage`
4. Smooth overlay appears: "Sign in to continue building" + **Sign In** button + dismiss (X)
5. Sign In → triggers SSO flow with `returnTo=/?resume=true`
6. After auth, landing page detects `resume=true` query param
7. Reads prompt from `sessionStorage`, transitions directly to builder (split-screen chat/preview), auto-populates and submits the prompt

### 5d. Session Lifecycle

- **Cookie:** `flamingo_session`, httpOnly, secure (production), sameSite strict
- **Duration:** 1 hour, signed JWT (HS256)
- **JWT claims:** issuer `"flamingo"`, audience `"flamingo"`
- **Proactive refresh:** Proxy middleware checks at 30-minute mark, calls `POST Onseason /api/sso/refresh`
- **Refresh updates:** subscription status, mode, capabilities from live Onseason DB
- **Revocation:** If refresh returns 401 → clear cookie, redirect to login
- **Logout:** `GET /api/auth/logout` → clears cookie, redirects to `/`

### 5e. Independent Sessions

Flamingo and Onseason maintain independent sessions. Being logged into Onseason does not automatically authenticate you in Flamingo. However:

- If you have an active Onseason session and click Sign In on Flamingo, the SSO authorize flow is instant (no login form — Onseason sees you're already authenticated and immediately generates the auth code)
- Onseason Dashboard has "Open Flamingo" button on the Website page that pre-authenticates via the same SSO flow
- Flamingo's profile dropdown has "Onseason Dashboard" link (opens new tab)

### 5f. Admin Impersonation

When an Onseason platform admin impersonates a workspace and accesses Flamingo:

- SSO token carries the workspace owner's identity (not the admin's)
- `impersonatedBy` field set to the admin's user ID
- Flamingo can show an "Impersonating" banner using this field
- Full access to the workspace's Flamingo site

---

## 6. Flamingo: Session Data

### `PMSession` Type

```typescript
type PMSession = {
  pmId: string                              // Workspace owner's user ID
  workspaceId: string                       // Workspace ID
  email: string                             // User email
  name: string                              // User display name
  image: string | null                      // Avatar URL (from OAuth or null)
  subscriptionStatus: 'active' | 'inactive' // Workspace subscription
  mode: 'active' | 'preview'               // Workspace mode
  subdomain: string | null                  // Booking site subdomain
  customDomain: string | null               // Booking site custom domain
  tenantId: string | null                   // PMS tenant ID
  currency: string                          // Workspace currency (default EUR)
  impersonatedBy: string | null             // Admin user ID if impersonating
}
```

### Onseason Access Token Storage

The `access_token` JWT from Onseason is needed for refresh and userinfo calls. Stored inside the Flamingo session JWT as an opaque string claim. On refresh, the new Onseason JWT replaces it.

---

## 7. Flamingo: Routes & Pages

### Auth API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/callback` | GET | Exchange auth code with Onseason, set session cookie, redirect |
| `/api/auth/refresh` | POST | Called by proxy for proactive refresh |
| `/api/auth/logout` | GET | Clear cookie, redirect to `/` |

### Pages

| Route | Auth | Purpose |
|---|---|---|
| `/` | Public | Landing page (hero + prompt) or builder (chat + preview) based on state |

Note: Workspace selection during auth is handled by Onseason's workspace picker page, not a Flamingo route.

### Proxy Middleware

**Public routes (no auth check):**
- `/` — landing page (prompt gate handles auth client-side)
- `/api/auth/callback`
- `/api/auth/logout`
- `/_next/*`, `/favicon*`, static assets

**Protected routes (require valid `flamingo_session` cookie):**
- `/api/sandbox`
- `/api/chat`
- `/api/morph-chat`
- All other routes

**Proactive refresh:** On every protected request, if session expires in <30 minutes, proxy calls `/api/auth/refresh` in-band, sets updated cookie on the response.

---

## 8. Flamingo: UI Components

### Navbar

**Unauthenticated state:**
- Onseason logo (left)
- "Sign In" button (right)
- Builder controls (undo, delete, etc.) hidden

**Authenticated state:**
- Onseason logo (left)
- Workspace name + user avatar (right) — avatar from `session.image`, fallback to initial-based avatar
- Dropdown menu:
  - User name + email
  - Current workspace name + role badge
  - "Switch workspace" → opens workspace list (fetched from Onseason `/api/sso/workspaces`)
  - Divider
  - "Onseason Dashboard" → opens Onseason in new tab
  - "Sign out" → `GET /api/auth/logout`
- Builder controls visible

### Workspace Switcher (in navbar dropdown)

- Fetches workspace list on demand from Onseason
- Shows workspace name, role, subscription status
- Selecting a different workspace triggers: redirect to `Onseason /api/sso/authorize?client_id=flamingo&workspace_id=<id>`
- Full re-auth ensures fresh data, clean sandbox/conversation teardown

### Prompt Gate Overlay

- Triggered when unauthenticated user submits a prompt
- Overlay/modal over landing page (not a page redirect)
- Text: "Sign in to continue building"
- **Sign In** button → SSO flow with `returnTo=/?resume=true`
- Dismiss (X or click outside) → closes overlay, prompt stays in input
- Prompt saved to `sessionStorage` before showing overlay

---

## 9. Onseason: Dashboard Integration

### Website Page Buttons

The existing "Open Staycy Editor" / "Open Website Editor" buttons on the Onseason Dashboard's Website page become the pre-authenticated entry point to Flamingo:

- Button triggers `GET /api/sso/authorize?client_id=flamingo&workspace_id=<current_workspace_id>`
- Since the user is already authenticated on Onseason with a workspace context, the flow is instant: generate auth code → redirect to Flamingo → authenticated
- No workspace picker needed (workspace is already known)

---

## 10. Security

| Measure | Implementation |
|---|---|
| **Authorization codes** | Opaque UUIDs, 5-min TTL, single-use (enforced via `usedAt` column) |
| **No sensitive data in URLs** | Auth codes replace JWTs in redirect URLs |
| **CSRF protection** | `sameSite: 'strict'` on Flamingo session cookie |
| **XSS protection** | httpOnly cookie, no JS access to session |
| **Open redirect prevention** | `returnTo` validated to only accept relative paths starting with `/`, reject `//` |
| **Server-to-server validation** | Auth code exchanged via backend POST, not client-side |
| **Secret storage** | `client_secret` stored as bcrypt hash in product registry |
| **Token expiry** | Flamingo session: 1 hour. Auth codes: 5 minutes. Proactive refresh at 30 min |
| **Rate limiting** | Onseason endpoints retain existing rate limits (login: 5/min, registration: 5/min, token exchange: 30/min) |
| **Admin impersonation audit** | `impersonatedBy` field enables audit logging in Flamingo |

---

## 11. Environment Variables

### Onseason (changes)

| Variable | Change |
|---|---|
| `STAYCY_SSO_SECRET` | Removed — replaced by per-product secrets in `sso_products` table |
| `STAYCY_BASE_URL` | Removed — replaced by per-product `baseUrl` in `sso_products` table |

### Flamingo

| Variable | Purpose |
|---|---|
| `ONSEASON_BASE_URL` | Onseason API base URL (server-side) |
| `ONSEASON_SSO_SECRET` | Shared secret matching Flamingo's entry in `sso_products` (min 32 chars) |
| `ONSEASON_SSO_CLIENT_ID` | `flamingo` — client ID for SSO |
| `NEXT_PUBLIC_ONSEASON_BASE_URL` | Onseason URL for client-side redirects |
| `FLAMINGO_SESSION_SECRET` | Secret for signing Flamingo's own session JWT (min 32 chars) |

---

## 12. Out of Scope

- Full OAuth 2.0 compliance (scopes, grant type negotiation, PKCE)
- Multi-factor authentication
- Account deletion flow from Flamingo
- Onseason admin UI for managing the product registry
- Staycy backward compatibility
