---
title: "Product Brief Distillate: Flamingo"
type: llm-distillate
source: "product-brief-flamingo.md"
created: "2026-04-09"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Flamingo

## Conversation Persistence — Schema & Design Decisions

- Git commits capture code diffs but lose: the PM's full nuanced prompt, Claude's explanation, clarifying questions, rejected changes, and multi-turn refinement sequences
- A rejected change produces no commit — conversation DB is the only record
- **Schema design (decided):**
  - `conversations` table: id, pm_id (from Onseason), site_repo (GitHub ref), created_at, updated_at
  - `messages` table: id, conversation_id, role (user|assistant|system), content (full text), commit_sha (nullable — bridges to git), metadata (JSON: model, token count, files changed, rejected flag), created_at
  - A conversation maps to an editing session; commit_sha links to git when code changed, null for clarifications/rejections
- **Database choice (decided):** Centralized Postgres on Neon or Supabase — NOT per-customer Payload DBs. Conversations are a builder concern, not a customer-site concern. Needs cross-PM analytics, support tooling, search across sessions
- **Contract impact:** Domain D must include conversation DB connection string in builder's environment config
- **Session reconstruction flow (decided):**
  1. Boot sandbox, clone PM's repo from GitHub
  2. Load last conversation from DB — full prompts, responses, clarifications, rejections
  3. Show real chat timeline in UI (not approximated from commits)
  4. Feed last 5–10 conversation turns to Claude — it knows what PM tried, rejected, and their language patterns
  5. Link to specific commits when PM wants to undo a specific change
- **Key UX outcome:** Claude gets much better context on return visits. Instead of 20 terse commit messages, it sees the actual conversation including nuance, preferences, rejected approaches. PM feels the agent "remembers" them.

## Business Model — Detailed Decisions

- Flamingo is a subscription product as Onseason's **primary item** — not a secondary add-on
- PMs create a workspace in Onseason, SSO into Flamingo to build their site
- **Free tier:** 20 messages/day (rolling reset, not per-session, not lifetime). Daily resets encourage return engagement. Power users upgrade to paid tier
- **Paid tier:** Custom domain + expanded limits. Target $29–49/month
- **Future gating options:** Token-usage tracking infrastructure built into v1 so economics can be adjusted without UX changes. CMS may be gated later (free for now). CRM addon planned as gated feature
- **Why 20/day rolling:** Per-session too easy to game by refreshing. Lifetime too punishing for exploration. Daily balances cost control with engagement encouragement
- **Gating infrastructure tracks token usage per PM, not just message count** — allows switching from message-based to token-based gating later

## Existing Codebase State — What's Built vs. Unbuilt

- **Working:** Fragments fork with chat UI + live E2B preview split-pane, two API routes (/api/chat streaming, /api/morph-chat diff editing), sandbox route (creation, reconnection, file writing, URL generation), custom 'edible-developer' E2B template with full component/hook/type catalog in system prompt, Supabase auth with teams model, landing page
- **Partially implemented:** Multi-file fragment output (schema has commented-out array support, sandbox route handles arrays, single-file is current default)
- **NOT built (all planned Domain A features):** Git commit pipeline, GitHub integration (Octokit), Onseason auth bridge/SSO, conversation database, ZEPL client integration in builder, Vercel publish flow, revenue attribution dashboard, message gating/usage tracking
- **Current publish:** Extends E2B sandbox timeout + KV-backed short URLs — NOT the planned GitHub-to-Vercel production deploy
- **Package still named** 'e2b-fragments' — needs rename to Flamingo
- **Tech versions:** AI SDK v3.3.8, E2B code-interpreter v1.0.2, Next.js 14.2.35, React 18.3.1
- **Default model:** Claude Sonnet 4 — supports 50+ models but product should be opinionated about default

## Competitive Intelligence — Specifics

- **Lodgify:** All-in-one PMS with drag-and-drop website builder. Gap: template-based, no AI generation, learning curve for non-technical PMs
- **Hospitable:** Operations-first PMS with AI guest messaging. Website is secondary add-on. Gap: limited design flexibility, no conversational customization
- **Guesty:** Enterprise PMS with AI listing content generation and IndexNow SEO. Gap: targets larger operators, pricing scales steeply, data portability concerns
- **Flataway.ai (also branded "Staycy"):** Closest direct competitor — AI website builder for VR direct-booking sites. Gap: early-stage, limited PMS integrations, no live sandbox preview, unclear differentiation beyond initial generation
- **hostAI:** AI-driven with programmatic SEO and smart retargeting for VR sites. Gap: marketing optimization focus, less design customization emphasis
- **Market data:** VR PMS market $3.3–5.3B in 2024–25, projected $10–12.5B by 2033–35 (8–13% CAGR). AI website builder market $2.69B in 2025, projected $17.4B by 2035 (20.5% CAGR)
- **Direct booking economics:** 26% of reservations but 38% of revenue. Higher nightly rates ($351 vs $248 Airbnb), longer stays (5.4 vs 4.0 days). 84% of VR professionals adopted AI tools in 2025
- **Key competitive risk:** Incumbents (Guesty, Lodgify) could add AI builders within 12 months — they own the customer relationship. Defense: ZEPL's multi-PMS normalization is structural advantage single-PMS builders can't replicate

## Platform Dependencies — Detailed Risk Analysis

- **E2B:** High lock-in. Sandbox template system, SDK, ephemeral VM lifecycle deeply embedded. Swap cost: 4–8 weeks. Named alternatives: Fly.io, Railway for self-hosted containers. Vercel Sandbox exists but different API surface. Fallback NOT Vercel Sandbox — it's simpler: editing blocked during outage, published sites unaffected
- **Claude/Anthropic:** Low lock-in. Vercel AI SDK abstracts provider. Swap to GPT-4o/Gemini needs prompt re-tuning (1–2 weeks), no architecture changes. Risk is quality regression, not engineering effort
- **Onseason/ZEPL:** High lock-in by design. Flamingo is architecturally a module of Onseason. Decoupling means rebuilding the backend. This is intentional, not a risk to mitigate
- **Payload CMS:** Medium lock-in. Self-hosted (good), but blog module, media, cross-module blocks all depend on Payload's local API. Swap: 6–10 weeks
- **Vercel hosting:** Medium lock-in. Next.js deploys elsewhere but Vercel-specific features (edge functions, ISR, preview deployments, per-PM provisioning via API) need replacement. Swap: 3–5 weeks
- **Resend email:** Low lock-in. Commodity service, swap to SendGrid/Postmark/SES in 1–2 days
- **GitHub per-PM repos:** Medium. Buffer commits locally during outages, batch-push on recovery

## Cost Scaling Analysis

- **E2B at 1000 PMs:** Non-linear risk. 300 concurrent sandboxes at 30% weekly active rate. Idle sandbox cost is the single largest variable. Need aggressive idle timeout, sandbox hibernation, or on-demand spin-up. Could reach $10K–30K/month without optimization
- **Claude at 1000 PMs:** Linear but high absolute. 60K messages/week with large system prompts (10K–50K tokens/turn). Could reach $20K–80K/month. Prompt caching essential. 20-message daily cap is critical cost control
- **Per-customer DBs at 1000 PMs:** Operational nightmare. Must redesign to multi-tenant before hitting this number. Neon scale-to-zero helps but managing 1000 databases needs dedicated DevOps
- **GitHub + Vercel at 1000 PMs:** Likely requires Enterprise agreements. Operational complexity scales super-linearly

## Reviewer Findings — Decisions Made

- **Skeptic: "100 subscriptions and 100 published sites are the same target"** → Fixed: separated free/paid targets. Paid conversion rate to be informed by actual free-to-paid funnel data
- **Skeptic: "No direct booking target"** → Fixed: >50% of published sites generating at least one booking within 90 days
- **Skeptic: "5–500 property range is too wide for one template"** → Acknowledged but deferred. The three-layer architecture allows significant visual divergence while keeping the booking engine consistent. Monitor at scale
- **Skeptic: "LLM failure rate undefined"** → Open question for PRD: define error budget for prompt-to-working-code generation and the graceful failure UX
- **Opportunity: "Revenue attribution dashboard as retention loop"** → Added to v1 scope. Data available from Onseason reservation system
- **Opportunity: "Powered by Onseason footer as growth flywheel"** → Already implemented in UI. Confirmed for v1
- **Opportunity: "SEO-optimized listing pages from ZEPL data"** → Noted for post-v1. Low effort, high yield but explicitly deferred from v1 scope
- **Opportunity: "Position as AI-native vertical SaaS, not website builder"** → Adopted in executive summary framing

## Open Questions for PRD

- What is the acceptable LLM failure rate for code generation? What does the PM see when generation fails? What's the recovery UX?
- What does the PM need configured in Onseason/ZEPL before Flamingo works? What's the minimum data quality for a good first generation?
- What happens when a PM's PMS data is sparse (missing photos, no descriptions)? The "aha moment" depends on rich first-generation output
- How is the system prompt assembled per-PM? (Documented: base instructions + .agent-rules.md + site.config.json + Display types + file tree — but PRD should detail the orchestration)
- Multi-file output per prompt: schema partially supports it, should v1 enable it?
- The "edible-developer" template persona uses Next.js 14.2.33 Pages Router in the sandbox — should this be upgraded to match the Next.js 15 App Router target for generated sites?

## Scope Signals Captured During Discovery

- **In v1:** Email/contact forms via Resend (PM prompts "add a contact form" and it works), revenue attribution dashboard, conversation persistence DB, blog/CMS, booking engine
- **Out of v1 (explicitly):** CRM, payment processing (Onseason handles), multi-language, SEO automation, template marketplace
- **Gate-ready but free for v1:** CMS/blog functionality
- **Infrastructure-ready but not enforced in v1:** Token-based usage metering (message count gating is the v1 mechanism)

## Technical Context — Fragments Fork Details

- System prompt is dynamically assembled: base instructions + .agent-rules.md + site.config.json + Display type interfaces + current file tree
- Morph (morph-v3-large via api.morphllm.com) generates diff instructions instead of full file rewrites — token efficiency for iterative edits
- E2B sandbox timeout: 10 minutes (10 * 60 * 1000 ms); current "publish" extends up to 24 hours max
- Rate limiting: 10 requests/day default (RATE_LIMIT_MAX_REQUESTS=10), bypassed with own API key — needs redesign for 20/day rolling model
- Template registered as 'edible-developer' in templates.ts with full component catalog (SearchFormState, DisplayListing, DisplayPricing, DisplayReview prop signatures) baked into the system prompt
- Auth: Supabase with teams model (users_teams junction, is_default flag). Needs replacement with Onseason SSO
- Deploy dialog still shows E2B-original text about compute pricing — not customized for Vercel publish flow
- Fragment schema outputs single file per prompt. Multi-file: commented out in schema.ts but sandbox route already handles array case

## Rejected Ideas & Decisions Not to Pursue

- **Per-customer conversation storage in Payload DB:** Rejected — conversations are a builder concern, not a customer-site concern. Centralized DB enables cross-PM analytics and support tooling
- **Vercel Sandbox as E2B fallback:** Not viable as direct swap. Different product, different API. Fallback is simpler: block editing during outage, published sites continue working
- **Stuffing full conversation history into git commit messages:** Explicitly rejected — commit messages are too limited, can't capture rejections, clarifications, or multi-turn context
- **Per-session message limits:** Rejected in favor of per-day rolling — per-session too easy to game by refreshing
- **Lifetime message limits:** Rejected — too punishing for exploration, kills engagement
