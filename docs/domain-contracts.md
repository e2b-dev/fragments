# Domain Boundary Contracts

> These are the integration surfaces between domains. **Changing a contract triggers a sync before implementation.** Feed this file to your agent whenever your work touches another domain's territory.

---

## A <-> B: Builder <-> Template

**Contract owner:** Jointly owned. Domain B proposes, Domain A validates.

| Surface | Detail |
|---|---|
| File writes | Builder writes files to E2B sandbox filesystem and commits to GitHub. Template must boot and run via known start command (`bun --bun run dev --turbo`). |
| File structure | Template's `src/` directory layout is fixed. Builder's system prompt references specific paths. Changes to layout require both domains to agree. |
| `.agent-rules.md` | Lives in the template root. Defines what Claude can and cannot modify. **Domain B owns the content, Domain A consumes it for the system prompt.** |
| Boot sequence | E2B custom template image contains all deps. Builder expects port 3000 with Vite HMR. |

**Overlap risk:** If Domain B restructures the template file layout, the agent rules and builder's system prompt must update simultaneously. Both merge together.

---

## B <-> C: Template <-> CMS

**Contract owner:** Display types are the contract. Domain B owns Display types, Domain C maps to them.

| Surface | Detail |
|---|---|
| Payload collections | Defined in `payload.config.ts`. Blog components consume `DisplayPost` types from the adapter layer. |
| Block registry | Cross-module blocks (`listing-embed`, `availability-widget`, `booking-cta`) must match both the Payload block schema (C) and the booking component props (B). |
| Database | Each customer site needs a database URI. Domain D provisions this; Domain C defines the schema via Payload config. |
| Display types | `DisplayPost`, `DisplayCategory` are the stable interface. Domain C's transforms produce these from Payload data. |

**Overlap risk:** If Domain B changes a booking component's props, Domain C's block renderer that embeds that component in blog posts breaks. Display types are the firewall.

---

## B <-> D: Template <-> ZEPL Client

**Contract owner:** SDK types are the contract. Domain D publishes, Domain B validates.

| Surface | Detail |
|---|---|
| SDK imports | Template's adapter hooks import from `@onseason/zepl-client`. SDK exports: `searchListings()`, `getListingById()`, `checkAvailability()`, `getQuote()`. |
| Type flow | SDK types -> transforms in Domain B -> Display types. If the SDK adds a field, Domain B decides whether to surface it. |
| Version pinning | Template's `package.json` pins SDK to a semver range. Domain D publishes; Domain B validates before bumping. |

**Overlap risk:** SDK breaking changes cascade through transforms into Display types. Semver discipline is critical.

---

## A <-> D: Builder <-> Onseason

**Contract owner:** Domain D defines the API shape. Domain A consumes it.

| Surface | Detail |
|---|---|
| PM config | When a PM opens the builder, Domain A calls Onseason API to get PM config (ZEPL credentials, branding, feature flags). Domain D defines this API shape. |
| Auth | PM authenticates via Onseason. Domain A receives a session token. Domain D validates it. |
| Publish flow | Domain A triggers Vercel deployment via Domain D's deployment API. |
| Provisioning | Domain D provisions GitHub repo + Vercel project + database for new PMs. Domain A needs the repo URL to load returning users. Domain C needs the database URI. |

**Overlap risk:** Provisioning is the most cross-cutting flow. Domain D owns the pipeline and exposes a single API that returns all required references.

---

## Contract Change Protocol

1. Proposing domain drafts the change (type update, API change, file structure change)
2. Post in shared channel with `[CONTRACT]` prefix
3. Affected domain owner reviews within 24 hours
4. Coherence Manager (Eddy) approves or calls a blocking sync
5. Both domains implement and merge together

**Default assumption:** If you're unsure whether something crosses a domain boundary, assume it crosses and check first.
