---
title: "Product Brief: Flamingo"
status: "complete"
created: "2026-04-09"
updated: "2026-04-09"
inputs:
  - docs/project-context.md
  - docs/domains/domain-a-builder.md
  - docs/domains/domain-b-template.md
  - docs/domains/domain-c-cms.md
  - docs/domains/domain-d-integration.md
  - docs/domain-contracts.md
  - docs/way-of-work.md
---

# Product Brief: Flamingo

## Executive Summary

Property managers lose 15–20% of every booking to OTA commissions. Direct bookings yield higher nightly rates ($351 vs. $248 on Airbnb), longer stays, and repeat guests — but most PMs lack the technical skills to build a direct-booking website, and the template-based tools available today produce rigid, generic sites that don't convert. Flamingo eliminates that dependency by giving every Onseason PM a direct-booking website they can build through conversation.

A PM writes a short description of their business, and within seconds sees a polished, production-ready booking website — live preview, real listings pulled from their PMS, and a working booking engine. From there, every change happens through chat: "make the hero darker," "add a testimonials section," "write a blog post about local restaurants." The AI handles the code. The PM handles the vision. It works with their existing PMS on day one — no data migration, no API configuration, no technical setup.

This is possible now because of three converging shifts: LLMs can reliably generate production-quality frontend code, sandbox environments enable real-time preview during generation, and Onseason's ZEPL layer already normalizes PMS data across dozens of providers. Flamingo is not a website builder — it's an AI-native vertical platform for hospitality that turns a non-technical PM into someone with a fully functional direct-booking business, in minutes, not months.

## The Problem

Property managers are caught in a dependency trap. OTAs control distribution, take 15–30% per booking, and own the guest relationship. 40% of travelers say they want to book direct in 2026, but the supply side is broken — PMs aren't equipped to capture that demand.

Current solutions fail in predictable ways:

- **PMS add-on websites** (Lodgify, Guesty, Hospitable) offer template builders as secondary features — rigid designs, limited customization, and the site always feels like an afterthought to the PMS.
- **General website builders** (Wix, Squarespace) have no booking engine, no PMS integration, and require the PM to become a web designer.
- **Custom development** works but costs $5K–$20K and takes weeks. Only viable for large operators.

### What We've Learned from 10 Existing Custom Builds

Onseason currently builds and maintains custom direct-booking websites for 10 paying PMs. This experience has validated three things: PMs are willing to pay for a direct-booking site when the result is good, the primary demand is for design flexibility and speed of changes (not just having a site), and the ZEPL data layer is mature enough to power real-time booking on generated sites. These 10 PMs become the first migration candidates and validation cohort for Flamingo.

## The Solution

Flamingo gives every Onseason PM a conversation-powered website builder. The experience:

1. **Instant first impression** — PM writes a short description of their business. Flamingo generates a complete, beautiful booking website with real listings, availability, and pricing pulled live from their PMS via ZEPL. The "aha moment" is immediate — "it already looks this good?"
2. **Conversational refinement** — Every design change happens through chat. The PM describes what they want; the AI writes the code; the live preview updates in seconds. Multi-turn iteration — the AI remembers what the PM tried, what they rejected, and adapts.
3. **Full content suite** — Blog with CMS (Payload), contact forms wired to email delivery (Resend), marketing pages — all generated and editable through the same chat interface.
4. **Revenue visibility** — A dashboard showing direct bookings generated and commission savings vs. OTAs. "You saved $4,200 this month" is the number that makes PMs never want to cancel.
5. **Publish and go** — One click to publish on an Onseason subdomain. Custom domains available with subscription. Every published site carries a "Powered by Onseason" footer.

Under the hood, the AI operates within strict architectural boundaries: it can modify any visual element but cannot break the booking engine, API integrations, or data layer. This means PMs get creative freedom without risk.

## What Makes This Different

**Works with your existing PMS on day one.** Flamingo connects to Onseason's ZEPL unified PMS API, which normalizes data across dozens of property management systems (Guesty, Hostaway, Beds24, Lodgify, and more). No data migration, no API configuration. Generated websites have real listings, real availability, and a real booking engine from the first prompt. No competitor offers AI website generation with live PMS data flowing through it.

**The "aha moment" architecture.** Most builders start with a blank canvas or a template picker. Flamingo starts with a fully rendered, genuinely impressive website. The PM's first experience is surprise, and every interaction after that builds trust.

**Conversation persistence.** The AI doesn't just generate code — it maintains a full interaction history in a dedicated conversation database, linked to git commits by SHA. When a PM returns days later, the builder remembers what they tried, what they liked, what they rejected, and what language they use. The PM feels like they have a dedicated designer who knows their taste, not a stateless tool.

**Protected generation architecture.** A three-layer system (presentation / adapter / data) ensures the AI can freely modify visual components while the booking engine, PMS integration, and CMS remain structurally sound. This solves the fundamental reliability problem of AI code generation in production — and is a defensible technical moat, not just a reliability feature.

## Who This Serves

**Primary: The mid-market property manager (5–500 properties).** Non-technical, time-constrained, already using Onseason for reservations and guest management. They know direct bookings matter but haven't had an accessible path to building a site. They're comfortable with chat interfaces and expect things to "just work." Many currently have no direct-booking website at all.

**Early adopters: 10 existing PMs** already paying Onseason for custom-built websites. These become migration candidates and the first validation cohort.

**Not in scope: Enterprise operators (500+ properties)** with complex brand requirements and multi-region deployments. These need custom work beyond what conversational AI delivers today.

## Business Model & Unit Economics

**Pricing:** Subscription product as Onseason's primary offering. PMs create a workspace, SSO into Flamingo, and build their site.

- **Free tier:** Subdomain hosting, 20 free AI messages per day (rolling reset). Sufficient for initial generation and light ongoing edits.
- **Paid tier:** Custom domain, expanded message limits, priority generation. Target price point: $29–49/month.
- **Future gating:** Token-usage tracking infrastructure ready for finer-grained metering. CMS and CRM addons may be gated in future tiers.

**Per-PM infrastructure cost at steady state:**

| Component | Monthly Cost | Notes |
|---|---|---|
| E2B sandbox compute | ~$0.20 | ~4 editing sessions/month, ephemeral |
| Claude API tokens | $0.40–1.20 | 10–15 prompts per session |
| Morph (diff editing) | $0.12–0.36 | ~30% of Claude cost |
| Neon database (Payload) | $0.50–1.00 | Scale-to-zero, minimal blog writes |
| Vercel hosting | $0.50–2.00 | Shared Pro plan |
| GitHub repo | ~$0.10 | Team plan, negligible per-repo |
| **Total per PM** | **$2–5/month** | Idle PMs cost near-zero |

At 100 PMs: $200–500/month in infrastructure. Scale-to-zero architecture (Neon, ephemeral E2B) means idle customers cost almost nothing. The paid tier covers infrastructure with healthy margin; the free tier is sustainable with message gating.

## Success Criteria

| Metric | Target | Timeframe |
|---|---|---|
| PMs with published websites | 100 | 6 months post-launch |
| Paid subscriptions (custom domain tier) | Target informed by free-to-paid conversion | 6 months post-launch |
| Time from first prompt to published site | < 30 minutes | At launch |
| PM return rate (2+ sessions) | > 60% | 3 months post-launch |
| Sites generating at least one direct booking | > 50% of published sites | Within 90 days of publish |
| Commission savings displayed in dashboard | Tracked from day 1 | Ongoing |

## Scope

**V1 includes:**
- Chat-based AI website generation with live E2B sandbox preview
- ZEPL-powered booking engine (search, listings, availability, quotes)
- Blog/CMS via Payload (posts, categories, media, cross-module booking embeds)
- Contact forms wired to Resend email delivery
- Git-backed code history + conversation database for session persistence
- Revenue attribution dashboard (direct bookings + commission savings vs. OTAs)
- "Powered by Onseason" footer on all generated sites
- Publish to Onseason subdomain
- Custom domain support (subscription-gated)
- 20 free AI messages per day (rolling); token-usage gating infrastructure ready

**V1 does not include:**
- CRM addon (planned, gating TBD)
- Payment processing within Flamingo (handled by Onseason)
- Multi-language site generation
- SEO automation tooling
- PM-to-PM template marketplace

## Data Ownership

PMs own their code (GitHub repo), their content (Payload CMS, exportable), and their domain. The booking engine requires an active Onseason subscription because it depends on live PMS data via ZEPL. If a PM leaves Onseason, their site code and content remain accessible — the live booking functionality does not.

## Platform Dependencies & Risks

**E2B (sandbox preview):** Highest single-point-of-failure for the editing experience. If E2B is down, PMs cannot edit — but published sites are unaffected (hosted on Vercel, fully independent of E2B). The sandbox layer is abstracted behind an interface; if E2B proves unreliable at scale, it can be swapped for a self-hosted container solution (Fly.io, Railway).

**Claude (code generation):** Core AI dependency. Vercel AI SDK abstracts the LLM provider — fallback to GPT-4o or Gemini requires prompt re-tuning but no architectural changes. Quality may degrade during failover.

**Per-customer databases:** Single-tenant Neon databases are the v1 architecture for isolation and simplicity. At 500+ PMs, we evaluate multi-tenant Payload (schema-per-tenant or row-level tenancy) to reduce operational overhead. The adapter layer already abstracts the data source, so this migration doesn't touch the presentation layer.

## Vision

If Flamingo succeeds, it becomes the default way Onseason PMs go direct. The 2–3 year trajectory:

- **Year 1:** 100+ PMs with live direct-booking sites. Flamingo becomes the primary reason new PMs join Onseason — "sign up and get a website" is a fundamentally different pitch than "sign up and manage your listings." Every published site carries the Onseason brand, creating a PM-acquisition flywheel.
- **Year 2:** CRM, guest communication, and marketing automation layered in. Flamingo sites become the PM's command center for direct guest relationships, not just a booking page.
- **Year 3:** The conversational builder pattern extends beyond websites — PMs prompt to create email campaigns, adjust pricing strategies, or generate marketing content, all connected to the same ZEPL data layer.

Flamingo isn't a website builder. It's the beginning of Onseason becoming the platform where property managers build their entire direct-booking business through conversation.
