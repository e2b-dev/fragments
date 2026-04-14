---
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-02b-vision'
  - 'step-02c-executive-summary'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
classification:
  projectType: 'saas_b2b'
  domain: 'hospitality_proptech'
  complexity: 'medium-high'
  projectContext: 'brownfield'
inputDocuments:
  - '_edible-output/planning-artifacts/product-brief-flamingo.md'
  - '_edible-output/planning-artifacts/product-brief-flamingo-distillate.md'
  - 'docs/project-context.md'
  - 'docs/index.md'
  - 'docs/domain-contracts.md'
  - 'docs/e2b-template-guide.md'
  - 'docs/domains/domain-a-builder.md'
  - 'docs/domains/domain-b-template.md'
  - 'docs/domains/domain-c-cms.md'
  - 'docs/domains/domain-d-integration.md'
  - 'docs/agent-rules-template.md'
  - 'docs/way-of-work.md'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 10
workflowType: 'prd'
---

# Product Requirements Document - Edible

**Author:** Eddy
**Date:** 2026-04-09

## Executive Summary

Property managers are trapped in an OTA dependency cycle — not just economically (15–30% commissions per booking) but structurally. Airbnb can change an algorithm overnight and collapse a PM's bookings by 40%. Guests can't be contacted directly. The PM's business runs on someone else's platform, under someone else's rules.

The tools that exist to break this cycle all fail the same way: PMS add-on websites (Lodgify, Guesty, Hospitable) produce rigid, template-based sites as a secondary feature. General builders (Wix, Squarespace) have no booking engine and no PMS integration. Custom development works but costs $5K–$20K and weeks of lead time. None of these options are accessible to a mid-market PM managing 5–500 properties with no technical staff.

Flamingo eliminates this gap. A PM writes a short description of their business and within seconds sees a complete, production-ready booking website — not a mockup, but a live site with their real listings, real availability, real pricing, and a working checkout, all pulled from their existing PMS via Onseason's ZEPL unified API. Every subsequent change happens through conversation: design, content, blog posts, contact forms. The AI writes the code. The PM drives the vision.

This is possible now because four forces have converged: LLMs can reliably generate production-quality frontend code, sandbox environments (E2B) enable real-time preview during generation, ZEPL already normalizes PMS data across dozens of providers — and on the demand side, guests are actively seeking direct booking options in 2026, creating urgency PMs can no longer ignore.

Flamingo is built on an existing Onseason codebase (a fork of E2B Fragments) with a working chat + live preview loop, two AI generation routes, and a custom E2B sandbox template. Ten PMs already pay Onseason for custom-built direct-booking websites — they become the first migration cohort.

### What Makes This Special

**The aha moment is recognition, not admiration.** Competitors can generate a pretty landing page from a prompt. Flamingo generates a pretty landing page that's already connected to the PM's 47 properties with live pricing and a working checkout. The PM's first reaction is "this is already mine" — not "this is already pretty." That distinction is the entire product.

**Compound moat, not a single advantage.** Defensibility comes from three capabilities that must exist simultaneously: a unified API across dozens of PMS providers (ZEPL, built over years), a reservation and payment processing layer (Onseason), and an AI generation architecture reliable enough for production booking flows (the three-layer protection pattern where the LLM can freely modify presentation but cannot break the booking engine, API integrations, or data layer). A PMS vendor bolting on an AI builder still has to solve generation reliability for checkout flows. A general AI builder still has to solve PMS normalization. Neither is a 6-month project.

**Control is the emotional driver; economics are the proof.** PMs frame the need as commission savings, but the deeper pain is autonomy — owning the guest relationship, not being subject to algorithm changes, building equity in their own brand. The revenue attribution dashboard ("you saved $4,200 vs. OTA fees this month") exists to validate the PM's decision, making them feel smart, not just richer. That's a retention mechanism, not a reporting feature.

## Project Classification

- **Project Type:** B2B SaaS platform — AI-powered website generation with multi-tenant architecture (per-PM GitHub repos, databases, Vercel deployments), subscription tiers (free with 20 daily AI messages, paid with custom domains and expanded limits)
- **Domain:** Hospitality / PropTech — property management, vacation rentals, direct booking
- **Complexity:** Medium-High — no heavy regulatory burden, but significant complexity in multi-tenant provisioning (GitHub + Vercel + Neon per PM), the three-layer architecture constraint for safe AI generation, cost scaling at volume, and cross-domain coordination across four teams
- **Project Context:** Brownfield — working Fragments fork with chat + live preview, partially implemented multi-file output, Supabase auth (to be replaced with Onseason SSO), existing 10-customer base on custom-built sites

## Success Criteria

### User Success

- **Aha moment delivery:** PM sees a site with at least 3 of their real listings (real photos, titles, pricing from their PMS) within 30 seconds of their first prompt. No placeholders, no sample data.
- **First-to-second prompt conversion:** > 80% of PMs who see their generated site send a second prompt. This is the behavioral proof that the aha moment landed.
- **Time to published site:** < 30 minutes from first prompt to a live site on an Onseason subdomain.
- **Return engagement:** > 60% of PMs return for 2+ editing sessions within 3 months of first use.
- **Ongoing editing confidence:** PM sends a design prompt and sees the result in the live preview. The experience should feel responsive enough that the PM trusts their words are being heard.

### Business Success

- **Published sites:** 100 PMs with published websites within 6 months of launch.
- **Paid conversion:** 15–20% free-to-paid conversion rate. At 100 PMs, that's 15–20 paying customers at $29–49/month ($435–$980/month subscription revenue).
- **Conversion trigger:** PMs who receive their first booking through a Flamingo site convert to paid at 3–4x the base rate. The booking is the proof point that drives the decision.
- **Blended infrastructure margin:** > 60% by end of year 1. At $2–5/month infra cost per PM and $29–49/month subscription, paying customers yield ~85–90% gross margin. Free-tier PMs cost $2–5/month with zero revenue. Blended margin at 15% conversion is ~40% — improving as paid base grows and per-PM infra costs drop with optimization.
- **Direct booking generation:** > 50% of published sites generating at least one direct booking within 90 days of publish.

### Technical Success

- **LLM generation reliability:** < 5% of prompts result in a broken preview. 95 out of 100 prompts produce a change that renders correctly.
- **Failure recovery UX:** On generation failure: last working state stays visible (never a white screen), chat message explains what went wrong and offers a retry, failed file changes auto-rollback in the sandbox. Failure mode is "a component doesn't render" (recoverable), never "the checkout flow is broken" (catastrophic).
- **Shadow validation:** Before pushing Claude's output to the sandbox, run a fast TypeScript check on changed files. Type errors trigger automatic retry before the PM sees anything. Adds ~1–2s to pipeline, catches ~30–40% of failures preemptively.
- **Prompt-to-preview latency:** p90 < 12 seconds for single-component changes (restyle, rearrange, content swap). 15–20 seconds acceptable for complex changes (new page section, blog post creation). Pipeline: Claude diff generation (~3–8s) → E2B file push → Vite HMR (<1s).
- **Multi-file output:** Supported from launch. Most meaningful changes touch 2–3 files (component + page + possibly tailwind config). Single-file-only would make the PM experience unacceptably limited.

### Measurable Outcomes

| Metric | Target | Timeframe | Signal Type |
|---|---|---|---|
| Time to first real listing rendered | < 30 seconds | At launch | Technical SLA |
| First-to-second prompt conversion | > 80% | At launch | Aha moment behavioral proxy |
| p90 prompt-to-preview latency (single component) | < 12 seconds | At launch | Editing experience |
| Prompt-to-broken-preview rate | < 5% | At launch | Generation reliability |
| PMs with published sites | 100 | 6 months post-launch | Adoption |
| PM return rate (2+ sessions) | > 60% | 3 months post-launch | Engagement |
| Free-to-paid conversion | 15–20% | 6 months post-launch | Monetization |
| Sites with at least one direct booking | > 50% of published | Within 90 days of publish | Value delivery |
| Blended infrastructure margin | > 60% | 12 months post-launch | Unit economics |

## Product Scope

### MVP — Minimum Viable Product

The honest priority: get to "PM publishes a site and receives their first booking" as fast as possible. Everything that accelerates that path is MVP.

- Chat-based AI website generation with live E2B sandbox preview (multi-file output per prompt)
- ZEPL-powered booking engine: search, listings, availability, quotes, checkout
- Three-layer protected architecture: LLM edits presentation freely, adapter and data layers locked
- Shadow TypeScript validation before sandbox push (automatic retry on type errors)
- Graceful generation failure: auto-rollback, last working state preserved, retry prompt
- Blog/CMS via Payload (posts, categories, media, cross-module booking component embeds)
- Contact forms wired to Resend email delivery
- Git-backed code history — every AI change is a commit, undo via git revert
- Conversation persistence database (centralized Postgres, not per-PM Payload DBs)
- Session reconstruction: returning PMs see real chat timeline, Claude gets last 5–10 turns for context
- Simple booking counter: "12 bookings this month through your website" in builder dashboard
- Onseason SSO (replaces Supabase auth)
- Publish to Onseason subdomain
- Custom domain support (paid-tier gated)
- 20 free AI messages per day (rolling reset), token-usage tracking infrastructure ready
- "Powered by Onseason" footer on all generated sites

### Growth Features (Post-MVP / v1.1)

- Full revenue attribution dashboard with OTA commission comparison ("you saved $4,200 this month") — requires Onseason reservation source tagging pipeline
- SEO-optimized listing pages from ZEPL data
- Token-based usage metering (replace message-count gating with finer-grained model)
- Advanced CMS features: newsletter signup, related listings in posts
- PM-facing analytics (traffic, most-viewed listings, conversion funnel)

### Vision (Future)

- CRM addon — guest communication and relationship management
- Marketing automation layered into Flamingo sites
- Multi-language site generation
- PM-to-PM template marketplace
- Conversational builder pattern extends beyond websites: email campaigns, pricing strategies, marketing content — all connected to ZEPL data
- Multi-tenant Payload (schema-per-tenant or row-level) when approaching 500+ PMs

## User Journeys

### Journey 1: The Guest — "I found this place on Google and I want to book it directly"

**Meet Sofia.** She's 34, a project manager in Munich, planning a week in Dubrovnik with her partner for their anniversary. She's been browsing Airbnb and found a few places she likes, but the prices feel inflated — she's read on travel forums that booking direct can save 10-20% and sometimes gets you perks like flexible check-in.

She Googles the property name she found on Airbnb plus "direct booking" and lands on a Flamingo-generated site: *adriatic-luxury-villas.com*.

**Opening Scene — First 5 seconds:**
The hero loads with a full-bleed photo of the Dubrovnik coastline at golden hour. The property manager's logo is top-left, professional but not corporate. A search bar sits prominently: dates, guests, location. Sofia's first thought: "This looks real. This isn't some Wix site the owner threw together." The design quality signals legitimacy — she doesn't bounce.

**Rising Action — The search:**
She enters her dates (June 14–21), 2 guests, Dubrovnik. The search results load with real photos, real per-night pricing, and availability badges. She spots the same apartment she found on Airbnb — but the nightly rate shows €285, not the €327 she saw on Airbnb. She also sees three similar properties she hadn't discovered. Each listing card shows a rating, guest count, key amenities, and a clear "View Details" CTA.

She clicks into the apartment listing. The detail page has a gallery (not just the 5 Airbnb photos — the PM uploaded 18), full amenity list, a neighborhood description, reviews from previous guests, and an availability calendar that shows her dates are open. The pricing breakdown is transparent: €285/night × 7 nights + €95 cleaning fee + €0 service fee. Total: €2,090. She calculates: Airbnb would have been ~€2,450 after their service fee.

**Climax — The booking decision:**
Two things push her over the edge: the transparent pricing (no hidden service fee — that's the whole point of direct) and a "About Your Host" section with the PM's photo and a short bio that makes this feel personal, not transactional. She hits "Reserve" and enters the checkout flow: guest details, payment (handled by Onseason's payment processor), and a confirmation page. The whole checkout takes 90 seconds. She gets an email confirmation immediately.

**Resolution — The new reality:**
Sofia saved ~€360 on a week's stay. She bookmarks the site. Next year, she'll search *adriatic-luxury-villas.com* directly instead of opening Airbnb. She tells her friend who's also planning a Dubrovnik trip. The PM gained a direct relationship with a guest who would have been anonymous behind Airbnb's messaging system.

**What could go wrong:**
- Search returns no results for her dates → she bounces, assumes the site is broken
- Listing photos are sparse or low-quality (PM's PMS data is thin) → site feels less trustworthy than Airbnb
- Checkout asks her to create an account before booking → friction kills conversion
- Payment fails or feels insecure → she goes back to Airbnb where she trusts the process
- No instant email confirmation → anxiety, she wonders if her booking went through

**This journey reveals requirements for:**
- Search that returns fast, filtered, real-time results from ZEPL
- Listing detail pages with rich media, transparent pricing, reviews, availability
- Checkout flow that's frictionless (guest checkout, no account required for first booking)
- Payment processing trust signals (SSL, recognizable payment provider, clear cancellation policy)
- Instant transactional email on booking confirmation (Resend)
- Mobile-responsive design (Sofia is probably on her phone during initial discovery)
- SEO-capable listing pages (she found the site via Google — post-MVP, but the URL structure and metadata must support it from day 1)

### Journey 2: The PM (First Visit) — "I just want a website that actually gets me bookings"

**Meet Marco.** He's 41, manages 23 vacation rental properties along the Croatian coast through Hostaway. He's been with Onseason for a year — uses it for reservations and guest communication. He has no website. His properties are listed on Airbnb, Booking.com, and Vrbo. He pays 15-18% commission on every booking and quietly resents it. His neighbor, another PM, just launched a direct-booking site and told Marco over coffee that she got 6 bookings last month without paying a cent in commission. Marco logged into Onseason that afternoon.

**Opening Scene — The prompt:**
Marco sees the Flamingo entry point in his Onseason dashboard. He clicks it. SSO handles auth — no new account, no password, no friction. He lands in the builder: a chat pane on the left, an empty preview pane on the right. A system message greets him: "Describe your business and I'll build your website."

Marco types: "I manage luxury villas and apartments on the Dalmatian coast. Most of my properties are in Dubrovnik and Split. My guests are couples and families looking for a premium experience."

**Rising Action — The aha moment:**
Within 30 seconds, the preview pane populates. Not a wireframe. Not a template with placeholder text. A fully rendered website with his logo (pulled from Onseason branding config), a hero image of the Dubrovnik coastline (from his top-performing listing's gallery in Hostaway via ZEPL), and a search bar. Below the fold: a grid of his 23 properties with real photos, real per-night prices, and real availability. The design is clean, professional — it looks like something a design agency would charge €8,000 for.

Marco's first reaction: "Wait, those are my actual listings." He clicks one. The listing detail page has the full gallery from his PMS, the amenity list, the pricing breakdown. It's all real. His second reaction: "This is already better than anything I could have built."

He sends his second prompt within 45 seconds: "Can you make the colors darker? More navy and gold, like a luxury hotel."

The preview updates in 8 seconds. The hero section shifts to deep navy with gold accent typography. The listing cards pick up the new palette. Marco is now leaning forward.

**Climax — The third prompt and the trust moment:**
Marco types: "Add a section about our concierge service — we arrange private boat tours, wine tastings, and airport transfers for our guests." A new section appears below the listings grid with a headline, three feature cards with icons, and placeholder text that Claude drafted from his prompt. It's not perfect — the copy is a bit generic — but the structure is right. Marco refines: "Make the concierge section sound more personal, like I'm talking to the guest directly." The copy updates. Now it reads like him.

This is the trust moment. Marco realizes the AI isn't just executing commands — it understands what he's going for. He's not fighting a template. He's having a conversation with something that listens.

**Resolution — Publishing:**
Over the next 20 minutes, Marco makes 6 more prompts: adjusts the navigation, adds a contact form, tweaks the footer, asks for a blog section ("I want to write about things to do in Dubrovnik"). Each change appears in seconds. He previews the site on mobile using the device toggle. It looks good.

He clicks "Publish." The site goes live at *marco-villas.onseason.com* in under 30 seconds. He copies the URL and texts it to his wife. Then he starts thinking about upgrading to a custom domain — *adriatic-luxury-villas.com* — which means the paid tier. He doesn't upgrade yet. But the seed is planted.

Total time: 25 minutes from first prompt to a live website with 23 real listings and a working booking engine.

**What could go wrong:**
- ZEPL data is sparse — few photos, no descriptions → the aha moment falls flat because the generated site looks empty
- Sandbox boot takes more than 10 seconds → Marco stares at a loading screen, wonders if it's broken, considers closing the tab
- First generation fails (TypeScript error, render crash) → Marco sees nothing or an error. First impression destroyed. He doesn't come back.
- Claude misunderstands the prompt and makes an unwanted change → Marco needs a clear way to undo (git revert exposed as "undo last change" in the UI)
- Publish fails or takes too long → Marco loses confidence in the product's reliability at the most critical moment

**This journey reveals requirements for:**
- Onseason SSO: zero-friction entry from existing dashboard
- PM config injection: branding, ZEPL credentials, and feature flags flow automatically on first load
- First-generation quality: system prompt must include enough context (listing count, property types, location, branding) to produce a site that feels personalized, not generic
- Minimum ZEPL data quality check: before first generation, validate that the PM has enough listing data (photos, descriptions, pricing) for a compelling first render. If sparse, surface a message: "Your site will look better with more photos — here's how to add them in Hostaway"
- Undo as a first-class feature: exposed in UI, not buried in git commands
- Publish flow: subdomain deployment in < 30 seconds, clear success confirmation with URL
- Mobile preview toggle in the builder

### Journey 3: The PM (Returning Session) — "I need to update my site for summer season"

**Meet Marco, three weeks later.** His site has been live. He's gotten 4 bookings through it — he can see the counter in his builder dashboard. He wants to update his site for peak season: new hero image, a blog post about Dubrovnik summer events, and updated pricing (which happens automatically through ZEPL — he just needs the site to look seasonal).

**Opening Scene — Session reconstruction:**
Marco opens Flamingo from his Onseason dashboard. The builder loads his existing site from his GitHub repo into a fresh E2B sandbox. In the chat pane, he sees his full conversation history — not a summary, not commit messages, but the actual back-and-forth from his first session. "Make the colors darker." "Add a section about our concierge service." He remembers where he left off.

A system message: "Welcome back, Marco. Your site has received 4 bookings since you published. What would you like to work on today?"

**Rising Action — The returning experience:**
Marco types: "It's almost summer. Can you update the hero to feel more summery? And I want to write a blog post about the best beaches near Dubrovnik."

Claude remembers his preferences — the navy and gold palette, the personal tone, the luxury positioning. The hero image swaps to a brighter coastal scene (still from his gallery) with adjusted typography. The existing color scheme stays consistent because Claude has context from the previous session about Marco's aesthetic choices, including the approaches he rejected.

For the blog post, Claude generates a draft: "5 Hidden Beaches Near Dubrovnik Your Guests Will Love." The post includes a listing embed block — three of Marco's nearby properties rendered as interactive cards within the blog content. Marco reads the draft, tweaks a few sentences, and approves it. The post publishes to his blog, immediately discoverable.

**Climax — The retention signal:**
Marco notices his booking counter has gone from 4 to 5 during his editing session. The dashboard shows: "5 bookings this month through your website." He's earning more from his website than he pays for it, and he hasn't even upgraded to the paid tier yet. He decides to register *adriatic-luxury-villas.com* and switches to the paid plan. Total time for this return session: 12 minutes.

**What could go wrong:**
- Sandbox clone takes too long (large repo, many assets) → Marco waits, gets impatient
- Conversation history is incomplete or garbled → Claude lacks context, makes suggestions that feel like starting over
- Claude doesn't remember Marco's preferences → regenerates in a default style, Marco has to re-explain his taste
- Blog post embed blocks fail to render booking components → cross-module contract broken (Domain B/C boundary)
- Pricing in listings is stale (ZEPL sync delay) → guest sees one price on the site, gets quoted another at checkout

**This journey reveals requirements for:**
- Fast sandbox reconstruction from GitHub repo (target: < 15 seconds to interactive preview)
- Conversation DB loading: full chat history with enough recent context fed to Claude for preference recall
- Blog authoring via chat prompts with cross-module block rendering (listing embeds, availability widgets)
- Real-time ZEPL data freshness — listings and pricing should reflect current PMS state
- Booking counter visible in builder dashboard as a retention touchpoint
- Subscription upgrade flow accessible from within the builder

### Journey 4: The Existing PM (Migration) — "Don't break what already works"

**Meet Ana.** She's one of the 10 PMs currently paying Onseason for a custom-built direct-booking website. Her site was hand-coded, she's been using it for 8 months, and it generates 15–20 bookings per month. She has a custom domain, a blog with 30 posts, and her guests know the URL. Ana is skeptical of Flamingo. Her site works. Why would she risk switching to an AI-generated one?

**Opening Scene — The pitch:**
Onseason contacts Ana about migrating to Flamingo. The pitch: "Your site keeps working exactly as it does now. But with Flamingo, you can make changes yourself instead of waiting for us. New blog posts, design tweaks, seasonal updates — all through conversation. Same domain, same content, same booking engine."

Ana's concern: "Will my blog posts survive? Will the design look as good? Will my SEO rankings tank?"

**Rising Action — The migration experience:**
Ana opens Flamingo. Instead of a blank prompt, the builder detects her existing site (GitHub repo already exists). It clones her repo into the sandbox and renders her current site in the preview. Everything looks the same. Her 30 blog posts are there (Payload DB migrated). Her custom domain still works.

A system message: "Welcome, Ana. I've loaded your existing site. Your 30 blog posts, custom design, and domain are all intact. Try making a change — just describe what you'd like."

Ana tests cautiously. "Make the footer font slightly larger." The footer updates. Nothing else changes. She checks her blog — posts render correctly. She checks a listing page — availability and pricing are live. She exhales.

**Climax — The conversion moment:**
Ana types: "I've been wanting to add a testimonials section with quotes from past guests for months, but I couldn't get it scheduled with the dev team." Fifteen seconds later, a testimonials section appears on her homepage with placeholder slots for guest quotes. She fills in three real quotes from her guest book. The section looks polished, consistent with her existing design.

The thing Ana couldn't get done in 8 months with a developer took 2 minutes with Flamingo. That's the conversion moment — not that Flamingo is cheaper (she was already paying), but that Flamingo gives her *agency* over her own site.

**What could go wrong:**
- Migration breaks existing design (template differences between custom-built and Flamingo's three-layer structure)
- Blog post content doesn't map cleanly to Payload schema → posts render incorrectly or lose formatting
- SEO URLs change → existing Google rankings tank (301 redirects essential)
- Ana's custom code modifications conflict with the three-layer boundary → some of her hand-coded customizations can't be preserved
- Performance regression → site was fast, Flamingo version is slower

**This journey reveals requirements for:**
- Migration tooling: import existing site repos into the Flamingo ecosystem without visual regression
- Payload content migration: map existing blog content into Payload collections preserving formatting and media
- URL preservation / 301 redirect mapping for SEO continuity
- Side-by-side comparison mode (or at minimum, a pre/post migration review step)
- Migration as a supported, documented operation — not a "figure it out" experience

### Journey 5: Onseason Operations — "Keeping 100 sites healthy at 2am"

**Meet Lena.** She's the Onseason platform engineer responsible for the Flamingo infrastructure. It's a Tuesday afternoon and she has 87 live PM sites, 12 sandboxes currently active, and a Slack alert that just fired: one PM's site is returning 500 errors on the checkout page.

**Opening Scene — The alert:**
Lena's monitoring dashboard shows: *marco-villas.onseason.com* — checkout route returning 500s for the last 15 minutes. Three guests have hit the error. Marco hasn't noticed yet (he's not in the builder).

**Rising Action — Diagnosis:**
Lena checks the error logs. The issue is a ZEPL API timeout — Hostaway (Marco's PMS) is having intermittent outages. The booking engine's adapter layer is throwing because the quote endpoint isn't responding within the timeout. This isn't a Flamingo bug — it's upstream. But Marco's guests are seeing a broken checkout.

Lena checks: is this affecting other PMs on Hostaway? She queries the operations dashboard — 4 other PMs use Hostaway through ZEPL. Two of them also show elevated error rates.

**Climax — The response:**
Lena has a playbook: the adapter layer should be catching ZEPL timeouts and showing a graceful error ("Pricing temporarily unavailable — please try again in a few minutes") instead of a 500. She checks — the error handling exists in the adapter but the timeout threshold is too aggressive for Hostaway's current response times. She pushes a config update to ZEPL that increases the timeout for Hostaway specifically. The 500s stop within 3 minutes.

She also files an internal ticket: "Adapter layer needs a circuit breaker pattern for PMS-specific outages. Current behavior degrades all affected sites simultaneously."

**Resolution:**
Lena sends a quick internal note: 5 PMs affected by Hostaway outage for ~18 minutes, no data loss, no booking failures (guests saw error before payment, not after), config fix deployed. She adds a monitoring rule: alert when any single PMS provider's error rate exceeds 5% across all sites using it.

**What could go wrong:**
- No centralized monitoring across PM sites → Lena doesn't know a site is broken until the PM complains
- No way to identify which PMs share a PMS provider → can't assess blast radius of upstream outages
- Provisioning failures leave orphaned resources (GitHub repo created but Vercel project failed) → manual cleanup
- E2B sandbox costs spike because idle sandboxes aren't being terminated → infrastructure budget alert
- No way to push a fix across all sites simultaneously → each PM's repo needs individual updates

**This journey reveals requirements for:**
- Centralized operations dashboard: site health, error rates, active sandboxes, infrastructure costs
- PMS provider health monitoring: per-provider error rates, blast radius assessment
- Provisioning pipeline with rollback: atomic creation of GitHub repo + Vercel project + database, with cleanup on partial failure
- Adapter layer resilience: circuit breaker pattern, graceful degradation per PMS provider
- Fleet-wide update mechanism: push SDK bumps or config changes across all PM repos
- Cost monitoring: per-PM infrastructure spend, sandbox lifecycle alerts, idle termination

### Journey 6: The Churning PM (Post-v1 — Retention Research)

**Note:** This journey is documented as a placeholder for post-launch behavioral research. The signals below are hypotheses to validate with real usage data.

**Meet Tomislav.** He built his site 4 months ago. It's live, it's getting bookings, and he hasn't opened Flamingo since week 2. His site is "done." He's a successful user by every metric — but he's paying $39/month for a product he doesn't actively use. When his credit card statement reminds him, he'll think: "Do I still need this?"

**Re-engagement triggers to validate post-launch:**
- Booking notification: "Your site generated 3 bookings this week — here's what guests searched for" (pull from ZEPL data)
- Seasonal prompt: "Summer season is approaching — want to update your hero image and highlight your pool properties?"
- Competitor signal: "A new direct-booking site launched in your area" (if detectable through ZEPL data)
- Content suggestion: "You haven't posted to your blog in 6 weeks — here's a draft about [local event] based on your listing locations"
- Performance nudge: "Your site's most-viewed listing doesn't have enough photos — adding 5+ photos could increase booking rate"

**This journey reveals future requirements for:**
- Automated engagement messaging (email/push) based on site activity and ZEPL data
- Content suggestion engine using PM's listing data and local context
- Competitive intelligence surface (if feasible through ZEPL ecosystem data)
- Lifecycle marketing tied to subscription renewal timing

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---|---|
| **Guest (Sofia)** | Fast search, rich listing detail, frictionless guest checkout, transparent pricing, instant confirmation email, mobile-responsive design, SEO-ready URL structure |
| **PM First Visit (Marco)** | Onseason SSO, PM config auto-injection, first-generation quality from ZEPL data, minimum data quality check, undo as first-class feature, publish in < 30s, mobile preview toggle |
| **PM Returning (Marco)** | Fast sandbox reconstruction (< 15s), conversation DB with preference recall, blog authoring via chat, real-time ZEPL data freshness, booking counter, subscription upgrade flow |
| **Migration (Ana)** | Migration tooling, Payload content import, URL preservation / 301 redirects, visual regression prevention, documented migration operation |
| **Operations (Lena)** | Centralized monitoring dashboard, PMS provider health tracking, atomic provisioning with rollback, adapter circuit breakers, fleet-wide update mechanism, cost monitoring |
| **Churning PM (Tomislav)** | Post-v1: automated re-engagement, content suggestions, competitive signals, lifecycle marketing |

## Domain-Specific Requirements

### Payment & Trust

- Payment processing is handled by Onseason (Stripe Elements or equivalent), not Flamingo. Generated sites never handle, store, or log card data. The three-layer boundary is the primary defense.
- **Checkout is a protected surface.** The checkout page layout, payment form embed, security badges, and cancellation policy display live in the adapter layer, not the presentation layer. The LLM can adjust colors and spacing to match the PM's brand, but cannot restructure the checkout flow or remove trust elements. A PM who prompts "make checkout simpler" gets a cleaner layout, not a page with the cancellation policy removed.
- Generated sites must display trust signals that match guest expectations for a booking platform: SSL, clear cancellation policy, recognizable payment UI, booking confirmation. A guest comparing against Airbnb's checkout needs to feel equally safe.

### GDPR & Data Privacy

- Guest market is predominantly European. GDPR applies to all guest data.
- **Baked into template, not PM responsibility:** Cookie consent, privacy policy pages, and data handling disclosures ship as part of the template. PMs don't prompt for these — they're always present.
- **Newsletter consent automation:** If the newsletter signup component is enabled in the blog module, the GDPR consent flow (explicit opt-in, double opt-in for EU), and unsubscribe mechanism are automatically included. The template makes it impossible to collect emails without the compliance wrapper.
- **Payload admin security:** The CMS admin panel at `/admin` must be behind auth at least as secure as Onseason's SSO. Weak Payload admin credentials are a guest data exposure risk (contact form submissions, blog comments, newsletter subscribers).
- **Conversation persistence DB:** Stores PM prompts and AI responses — PM business data, not guest PII. Still requires proper data handling, access controls, and retention policies.

### PMS Data Reliability & Graceful Degradation

**Design principle: the template must look professional with the worst data quality any PMS provides, not just the best.**

This is the difference between the aha moment working or failing. A PM whose listings have 1 blurry photo and no descriptions should still see a site that looks intentional, not broken.

Explicit handling required for:
- **0–1 photos:** Styled placeholder with map view or location imagery instead of a broken gallery. Never an empty carousel.
- **Missing descriptions:** Auto-generate a short description from listing metadata (bedrooms, location, amenities, property type) rather than showing blank space.
- **Incomplete pricing:** Display "Contact for pricing" rather than $0 or a stale number. Never show a price that doesn't match the actual ZEPL quote.
- **Missing amenities:** Hide the amenities section rather than showing an empty list.
- **Missing reviews:** Hide the reviews section rather than showing "0 reviews." A new listing without reviews should look like a listing, not like a listing that failed.

Pricing and availability must be real-time. A stale price that doesn't match the actual quote at checkout destroys trust instantly.

### Multi-Tenancy & Security

- Per-PM isolation (separate GitHub repos, Neon databases, Vercel projects) is architecturally sound for v1.
- **Provisioning must be atomic with rollback.** Partial failures (repo created, Vercel project failed) must not leave orphaned resources.
- **Cross-tenant security:** The orchestrator layer (Fragments fork) has access to all PMs' credentials — a high-value target. Requirements:
  - Proper secret management (not env vars in code)
  - Scoped API tokens per PM session (each session only accesses that PM's resources)
  - Audit logging for all credential access and provisioning operations
- Fleet-wide updates (SDK bumps, security patches) need a mechanism that works across hundreds of repos.
- At 500+ PMs, evaluate multi-tenant Payload and consolidated infrastructure to reduce operational burden.

### Seasonality

Hospitality is violently seasonal. A PM on the Croatian coast gets 80% of bookings between May and September.

Impact on Flamingo:
- **PM motivation cycle:** PMs build/update sites in March–April (pre-season), need sites to perform June–August, and review results in September. Product launch timing and onboarding campaigns must account for this.
- **Infrastructure load pattern:** Sandbox and compute usage spikes in spring (building season) and drops in winter. The cost model should factor seasonal variance — steady-state per-PM costs will be higher in Q2 than Q4.
- **Churn risk window:** September–October. If a PM's site didn't deliver bookings during peak season, they'll cancel before the next billing cycle. The booking counter and any re-engagement triggers are most critical in this window.
- **Re-engagement opportunity:** Pre-season (February–March). "Summer is coming — want to refresh your site?" is the highest-converting prompt timing.

### Photography & Visual Quality

The single biggest factor in whether a listing converts is photo quality. Flamingo can generate a gorgeous layout, but dark, poorly framed, or low-resolution photos will underperform regardless of design.

- **Known limitation for v1:** Flamingo does not enhance or modify photos. The PM's PMS photos are used as-is.
- **Minimum data quality check (MVP):** Before first generation, assess photo quality/quantity and surface guidance: "Your site will look better with more photos — here's how to add them in Hostaway."
- **v2 opportunity:** AI photo enhancement, suggested cropping, image quality scoring, placeholder generation for properties without photos.

### Channel Manager Conflicts

If the PM's channel manager doesn't know about the Flamingo site as a booking channel, double-booking risk emerges — a guest books on the Flamingo site while another books on Airbnb for the same dates.

- ZEPL handles availability sync, which should cover this if ZEPL properly registers as a channel. **This must be verified explicitly** — a double-booking is the worst possible outcome for a PM trying direct booking for the first time. One bad experience and they'll never trust the platform.
- The onboarding flow should include a step (or at minimum a clear message) confirming that the PM's channel manager recognizes ZEPL/Onseason as a booking source and will sync availability accordingly.

### Local Regulations

Short-term rental regulations vary by municipality: tourist tax collection, registration numbers, maximum night limits, required disclosures on booking websites.

- **Template includes optional regulatory slots:** Registration number field in `site.config.json`, tourist tax line item in the pricing breakdown, disclosure text on listing pages. These are configurable per PM, not hard-coded.
- PMs in regulated markets (e.g., Dubrovnik's strict STR rules) will expect these. Missing them isn't just a UX gap — it's a legal risk for the PM.
- These slots should be surfaced during the onboarding/provisioning flow: "Does your municipality require a registration number on your website?"

## Innovation & Novel Patterns

### Detected Innovation Areas

**Protected AI Generation for Transactional Surfaces.**
Flamingo constrains AI code generation to the presentation layer while the booking engine, checkout flow, and data integrations remain structurally locked. This is what makes AI generation viable in a domain where broken code means lost bookings. General-purpose AI builders (v0, Lovable, Bolt) generate in an open sandbox — the AI can touch anything. Flamingo's three-layer architecture is the first implementation of a "safe generation zone" pattern for a vertical SaaS product with live financial transactions flowing through the generated code. The checkout page extends this further: the LLM can style it but cannot restructure the flow or remove trust elements.

**Live Business Data as First-Generation Context.**
The aha moment — a PM's first prompt producing a site with their real listings, real pricing, and real availability — is a pattern no general-purpose AI builder can replicate. It requires three pre-conditions that took years to build: a normalized PMS data layer (ZEPL), a business context injection pipeline (Onseason config API), and a system prompt architecture that gives Claude PM-specific context (listing count, property types, location, branding). The result is recognition ("this is already mine"), not admiration ("this is already pretty"). This is structurally unique to Flamingo because it requires the ZEPL + Onseason ecosystem to exist.

**Conversation Persistence as Design Memory.**
Most AI tools are stateless. Flamingo's conversation database (linked to git commits by SHA) gives Claude memory of what the PM tried, rejected, and preferred across sessions. Returning users get a progressively better experience: Claude needs fewer clarifying prompts because it knows the PM's aesthetic preferences, tone, and rejected approaches. This turns a tool into a relationship — the PM feels they have a dedicated designer who knows their taste, not a stateless code generator.

### Validation Approach

| Innovation | Validation Metric | Target |
|---|---|---|
| Protected generation (three-layer) | Broken-preview rate | < 5%, zero checkout-breaking failures |
| Live data aha moment | First-to-second prompt conversion | > 80% |
| Conversation memory | Return session efficiency | Lower prompt-to-preview latency than first session; qualitative PM feedback that AI "remembers" them |

### Risk Mitigation

- **Three-layer boundary too restrictive:** PMs can't make changes they expect (e.g., "move the search bar below the hero" touches page layout near adapter components). Mitigation: expand the presentation surface gradually with human review of each expansion. Monitor PM prompts that hit boundary errors.
- **Aha moment fails for sparse data:** PMs with few photos or incomplete listings see an underwhelming first render. Mitigation: minimum data quality check before first generation, plus enriched system prompt with default content strategies for low-data scenarios.
- **Conversation memory degrades at scale:** Too many sessions produce too much context for Claude's window. Mitigation: summarization layer that condenses old sessions into preference profiles (color palette, tone, layout preferences, rejected patterns) rather than feeding raw history.

## SaaS/B2B Platform Requirements

### Multi-Tenancy Model

**Per-PM isolation (v1):** Separate GitHub repo, Vercel project, and Neon database per PM. The orchestrator (Fragments fork on Vercel) is the shared layer managing all PMs.

**Concurrency model:** The builder is stateless per request — each prompt is: receive message → call Claude → push files to E2B → respond. Vercel serverless functions handle concurrency natively. E2B handles sandbox concurrency at scale (built for thousands).

- **v1 sizing:** 20 concurrent sandboxes at peak. No artificial session limit.
- **Expected load:** 5–10 concurrent editing sessions at steady state, 15–20 during pre-season spikes (March–April).
- **Bottleneck:** Claude API rate limits, not builder infrastructure. Monitor and add queueing if 50+ concurrent sessions strain the orchestration layer.

### Permission Model

**v1: Single-user access.** PM authenticates via Onseason SSO and has full access to their builder workspace. No team or role model in v1.

**Design-for-teams principle (v1 architecture decisions that unblock v1.1+):**
- Conversation history stores `user_id` per message even though v1 is always the PM. This avoids a data model rewrite when team roles are added.
- Onseason auth integration uses scoped tokens rather than assuming one user per PM account. Team access becomes a permissions layer on existing data, not a schema migration.
- When multi-user ships: roles could include PM (full access), marketing (content + design, no config/publish), and view-only (preview only).

### Subscription Tiers

| Feature | Free Tier | Paid Tier ($29–49/month) |
|---|---|---|
| Hosting | Onseason subdomain | Custom domain |
| AI messages | 20/day (rolling reset) | Expanded limits |
| Blog/CMS | Full access | Full access |
| Booking engine | Full access | Full access |
| Token tracking | Infrastructure ready | Infrastructure ready |

**Message limit UX:**
- At 18 of 20 messages: subtle counter — "2 messages remaining today."
- At 20: "You've used your daily messages. Your site is saved — come back tomorrow, or upgrade for unlimited editing."
- Never cut off mid-generation — message 20 completes fully before the limit activates.
- No one-day pass for v1 — adds billing complexity for minimal revenue. Free → paid monthly is the only upgrade path.
- **Counting rule:** Only PM deliberate prompts count toward the daily limit. System messages, AI responses, and Claude's clarifying questions do not consume a message. Token-usage tracking infrastructure captures everything for future metering flexibility.

### Integration Map

| Integration | Purpose | Owner | Lock-in Risk |
|---|---|---|---|
| ZEPL | Booking data (search, listings, availability, quotes) | Domain D | High (by design — Flamingo is an Onseason module) |
| Onseason | Auth, PM config, payments, reservation processing | Domain D | High (by design) |
| GitHub | Per-PM code persistence, git history, undo | Domain A | Medium — buffer commits locally during outages |
| Vercel | Production hosting, deployment on publish | Domain D | Medium — Next.js deploys elsewhere but Vercel-specific features need replacement |
| E2B | Live preview sandboxes during editing | Domain A | High — deeply embedded; swap cost 4–8 weeks to self-hosted containers |
| Neon | Per-PM Payload CMS database (scale-to-zero) | Domain D | Medium — Payload is DB-agnostic |
| Resend | Transactional email (booking confirmation, contact forms) | Template | Low — commodity, swap to SendGrid/SES in days |
| Payload CMS | Blog content, media, cross-module blocks | Domain C | Medium — self-hosted, but deeply integrated |
| Claude (Anthropic) | Code generation | Domain A | Low — Vercel AI SDK abstracts provider; swap needs prompt re-tuning |
| Morph | Token-efficient diff application | Domain A | Low — replaceable with full-file writes at higher token cost |

### Third-Party Tracking & Analytics

**Support it through config, don't build a dashboard around it.** PMs will request Google Analytics and Meta Pixel within the first week.

`site.config.json` tracking section:
```json
{
  "tracking": {
    "googleAnalyticsId": "G-XXXXXXXXXX",
    "metaPixelId": "123456789",
    "customHeadSnippet": "<script>...</script>"
  }
}
```

- Template root layout injects tracking scripts in `<head>` when present.
- PM sets tracking via chat: "add my Google Analytics, the ID is G-ABC123" → Claude updates the config.
- `customHeadSnippet` is an escape hatch for Hotjar, TikTok Pixel, etc.
- **Agent rules carve-out:** Claude CAN modify the `tracking` section of `site.config.json` even though the config file is generally protected.
- Google Search Console verification: meta tag slot in template for site indexing. PMs serious about direct bookings need their site in Google. Making this easy is a quiet differentiator.
- No analytics dashboard inside Flamingo. Google Analytics already does that. The one exception: the booking counter (Flamingo-specific data GA doesn't have).

### Compliance Requirements

Covered in Domain-Specific Requirements (step 5): GDPR, PCI (via Onseason), cookie consent, newsletter consent automation, Payload admin security, local STR regulations. No additional SaaS-specific compliance requirements for v1 beyond standard practices (data encryption at rest and in transit, secure credential storage, audit logging).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the minimum feature set that delivers the full emotional arc of "describe your business → see your real listings → publish a working booking site." Every feature in MVP exists to get a PM from first prompt to first booking as fast as possible.

**Resource Requirements:** 3–4 developers across four domains (Builder, Template, CMS, Integration), plus Coherence Manager. Each domain owner works with AI agents. Cross-domain coordination via weekly sync cadence defined in way-of-work.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Guest (Sofia): full search → listing → checkout → confirmation flow
- PM First Visit (Marco): prompt → live preview with real data → iterate → publish
- PM Returning (Marco): session reconstruction → continued editing → blog authoring

**Not supported in MVP:**
- Migration (Ana): existing PMs keep current sites; greenfield only for v1
- Operations (Lena): manual monitoring acceptable; centralized dashboard is post-MVP
- Churning PM (Tomislav): re-engagement triggers require real usage data; post-launch research

**Must-Have Capabilities:**

| Capability | Rationale | Domain |
|---|---|---|
| Chat UI + E2B live preview (multi-file output) | Core builder experience — the product IS this | A |
| Claude code generation with three-layer protection | Safe generation is the moat | A |
| Shadow TypeScript validation + auto-rollback | < 5% broken-preview rate target | A |
| ZEPL-powered booking engine (search, listings, availability, quotes, checkout) | Without bookings, no product | B + D |
| Checkout as protected adapter surface | PCI safety, trust signals locked | B |
| Template graceful degradation for sparse PMS data | Aha moment must work for worst-case data quality | B |
| Blog/CMS via Payload (minimal: posts collection, listing-embed block, basic media) | Content drives organic traffic; cross-module blocks are differentiated | C |
| Git-backed code history + undo | Every change is a commit; undo is first-class | A |
| Conversation persistence DB (centralized Postgres) | Full session reconstruction; Claude gets preference context on return visits | A |
| Onseason SSO | Zero-friction entry from existing dashboard | D |
| PM config auto-injection (ZEPL credentials, branding, feature flags) | First generation needs PM-specific context | D |
| Publish to Onseason subdomain | PM needs a live URL | D |
| Custom domain support (paid-tier gated) | Primary free-to-paid conversion trigger | D |
| 20 messages/day rolling limit with token tracking infrastructure | Cost control + future metering flexibility | A |
| Simple booking counter in builder dashboard | "This is working" retention signal | A |
| Cookie consent, privacy policy, GDPR compliance baked into template | Non-negotiable for European guest market | B |
| Contact forms via Resend | Common PM request, low effort | B |
| Tracking config in site.config.json (GA, Meta Pixel, Search Console) | PMs need analytics from day 1; support through config, don't build dashboard | B |
| Regulatory slots in config (registration number, tourist tax) | PMs in regulated STR markets need this | B + D |
| "Powered by Onseason" footer | Brand flywheel | B |

**Explicitly NOT in MVP:**

| Capability | Reason for deferral |
|---|---|
| Migration tooling for existing 10 PMs | Genuine engineering across all domains; delays launch; existing sites keep running |
| Revenue attribution dashboard (OTA comparison) | Requires Onseason reservation source tagging pipeline — not ready |
| Centralized operations dashboard | Manual monitoring acceptable at < 100 PMs |
| Blog categories, newsletter, related posts | Payload minimal: posts + listing-embed only |
| Newsletter consent automation (GDPR double opt-in) | Deferred with newsletter feature |
| Team/multi-user access | Single-user v1; architecture designed to unblock later |
| Token-based usage metering (enforcement) | Infrastructure tracks tokens; enforcement stays message-count based |
| SEO automation tooling | URL structure and metadata support baked in; active optimization deferred |
| Circuit breaker pattern for PMS-specific outages | Adapter layer has basic error handling; advanced resilience post-MVP |
| Fleet-wide update mechanism | Manual repo updates acceptable at < 100 PMs |

### Payload MVP Scope Guard

Payload ships with the minimal viable config:
- **One collection:** `posts`
- **One block type:** `listing-embed` (renders ListingCard from booking module)
- **Basic media uploads** to Vercel Blob
- **Admin panel at `/admin`** — works out of the box, no customization
- **No:** categories, newsletter signup, related posts widget, availability-widget block, booking-cta block

**Critical validation:** Build the E2B template image with Payload early and verify sandbox boot time stays acceptable. If Payload pushes boot from ~2s to 15s+, re-evaluate.

### Post-MVP Features

**Phase 2 — Growth (v1.1, months 2–4 post-launch):**
- Migration tooling for existing 10 PMs (content import, URL preservation, visual regression checks)
- Full revenue attribution dashboard with OTA commission comparison
- Blog categories and related posts
- Newsletter signup with GDPR consent automation
- Adapter layer circuit breaker for PMS-specific outages
- PM-facing analytics (traffic, most-viewed listings)
- Fleet-wide SDK/config update mechanism
- Centralized operations dashboard (site health, error rates, costs)

**Phase 3 — Expansion (v2, months 6–12 post-launch):**
- Team/multi-user access with role-based permissions
- CRM addon (guest communication and relationship management)
- AI photo enhancement and image quality scoring
- Automated re-engagement messaging (seasonal prompts, content suggestions)
- Token-based usage metering (replace message-count gating)
- SEO optimization tooling
- Marketing automation
- Multi-language site generation

**Phase 4 — Vision (year 2+):**
- PM-to-PM template marketplace
- Conversational builder extends beyond websites (email campaigns, pricing strategies)
- Multi-tenant Payload at 500+ PMs
- Competitive intelligence surface

### Risk Mitigation Strategy

**Technical Risks:**
- **E2B dependency:** Highest SPOF for editing experience. Mitigation: published sites are independent (Vercel-hosted). If E2B is down, editing is blocked but live sites are unaffected. Sandbox layer is abstracted; swap to self-hosted containers (Fly.io, Railway) is 4–8 week fallback.
- **Claude generation quality:** < 5% broken-preview target. Mitigation: three-layer architecture limits blast radius to presentation only. Shadow TypeScript validation catches ~30–40% of failures before PM sees them. Auto-rollback ensures PM is never stuck in a broken state.
- **Payload in E2B boot time:** Adding CMS + database dependency to sandbox image could degrade boot performance. Mitigation: test early in development. If unacceptable, explore lazy Payload initialization or deferred CMS loading.

**Market Risks:**
- **PMs don't get bookings:** If generated sites don't convert guests, the entire value proposition collapses. Mitigation: guest journey (Sofia) anchors template design. Transparent pricing, frictionless checkout, mobile-responsive design are all MVP. The booking counter provides early signal.
- **12–18 month competitive window:** Incumbents (Guesty, Lodgify) could add AI builders. Mitigation: speed to 100+ live sites with proven conversion data. Switching costs (site history, blog content, custom design, domain) make the moat operational.
- **Seasonality timing:** Launching outside the March–April preparation window means PMs won't have motivation to build until next season. Mitigation: target launch before pre-season to capture peak motivation cycle.

**Resource Risks:**
- **Fewer developers than planned:** Minimum viable team is 2 — one full-stack (domains A + B) and one integration-focused (domains C + D). Coherence Manager role can be part-time. Feature set stays the same; timeline extends.
- **ZEPL data quality variance:** Some PMS providers return sparse data. Mitigation: graceful degradation is MVP (styled placeholders, auto-generated descriptions, hidden empty sections). Minimum data quality check before first generation surfaces guidance to PM.

