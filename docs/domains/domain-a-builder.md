# Domain A: Builder Experience — Agent Brief

> Feed this file to your AI agent alongside `CLAUDE.md`. It defines what Domain A owns, can modify, and must not touch.

---

## Scope

You own the **PM-facing builder experience**: the Fragments fork that provides the chat + preview UI, E2B sandbox lifecycle management, Claude integration for code generation, the Staycy memory system, the git commit pipeline, and session persistence for returning users.

## Key Deliverable

**A PM can prompt, see a live preview, undo changes, and publish their site. Staycy (the AI assistant) remembers the PM's preferences, past decisions, and working style across sessions.**

## What You Own

| Area | Details |
|---|---|
| Fragments fork | The Next.js 14 app that hosts the chat pane and preview iframe |
| Chat UI | Prompt input, streaming AI responses, conversation history |
| E2B lifecycle | Boot sandbox, push files, get preview URL, kill on idle/close |
| Claude integration | System prompt construction, Vercel AI SDK streaming, Morph for diff apply |
| Staycy memory system | 4-tier memory retrieval + post-response write pipeline (see below) |
| Git commit flow | Every AI change = a commit. Undo = git revert via Staycy's memory linkage. |
| Session persistence | Code state via GitHub. Conversational memory via Staycy (Neon pgvector). |
| Publish trigger | PM clicks Publish -> call Domain D's deployment API |

## What You Consume (Do NOT Modify)

| Dependency | Owner | Contract |
|---|---|---|
| `.agent-rules.md` | Domain B | Defines what Claude can/cannot modify in the template. You build the system prompt from this file. |
| Template file structure | Domain B | The `src/` layout is fixed. Your file write paths must match. |
| E2B custom template image | Domain B (with C and D contributions) | You boot sandboxes from this image. Expect port 3000, Vite HMR. |
| Onseason PM config API | Domain D | You call this on session start to get ZEPL credentials, branding, feature flags. |
| Deployment API | Domain D | You call this when PM clicks Publish. |

## Staycy Memory System

Staycy is the AI assistant persona that PMs interact with. She has a four-tier memory system that runs on a single Neon Postgres database with pgvector. Full plan: `docs/staycy-memory-system-plan.md`.

### Memory Retrieval (before every Claude call, ~150-200ms)

| Tier | What | Latency | Source |
|---|---|---|---|
| 1. Working memory | Last 10 messages + change summaries from current session | ~5ms | `messages` table |
| 2. Session summaries | LLM-generated summaries of past 5 sessions | ~10ms | `conversations` table |
| 3. Vector search | Top 5 semantically similar past messages (with change summaries) | ~80-100ms | pgvector HNSW index |
| 4. PM facts + Staycy notes | Extracted preferences, constraints, brand details, Staycy's own observations | ~10ms | `pm_facts` table |

All four tiers run in parallel via `Promise.all()`. The assembled context block (~1,500 tokens) is injected into Claude's system prompt.

### Post-Response Pipeline (async, non-blocking)

After Claude responds and the PM sees the preview update:
1. Save message pair to `messages` table
2. Generate embedding for user message (text-embedding-3-small, 1536 dims)
3. Fetch git diff -> generate LLM change summary (what visually/functionally changed)
4. Store `commit_sha` + `files_changed` + `change_summary` on the assistant message
5. Every 5th message: extract PM facts via LLM (preferences, constraints, brand, site_state, history)
6. On session end: generate session summary (fed by change summaries for precision)
7. On session end: Staycy writes self-notes about the PM's working style

### Git + Memory Integration

- **Change summaries** bridge conversation and code. Git stores the raw diff; memory stores a human-readable summary of what changed ("Changed Hero.tsx: overlay 40%->70%, font Inter->Playfair Display"). This is what Staycy references for recall, not raw diffs.
- **Undo via git linkage:** PM says "go back to the font we had before" -> vector search finds the relevant past message -> `change_summary` tells Staycy the exact font -> `commit_sha` lets her fetch the parent commit state from GitHub -> Claude generates the revert.
- **Facts with provenance:** Every extracted fact links back to the conversation and message it was derived from. Contradicted facts are soft-deleted and linked to their replacement via `superseded_by`.

### Infrastructure

- **Single Neon Postgres database** (shared builder project, NOT per-customer Payload databases)
- **pgvector extension** for HNSW vector index
- **OpenAI text-embedding-3-small** for embeddings (1536 dims, ~$0.00002/message)
- **Total memory cost:** ~$0.022/session (~$8.80/month at 100 PMs, 4 sessions/month)

## System Prompt Construction

The builder's system prompt for Claude (Staycy) is assembled from:
1. **Staycy persona** — personality, tone, how she references memory naturally
2. **Memory context block** — assembled by the memory orchestrator (~1,500 tokens)
3. **`.agent-rules.md`** — what files are editable vs protected (from Domain B's template)
4. **`site.config.json`** — PM's branding, feature flags
5. **Display type interfaces** — so Claude knows the props contracts for components
6. **Current file tree** — so Claude knows what exists in the PM's repo

## Week 1 Target

Fork Fragments, strip to single persona ("Booking website"), boot an E2B sandbox with a hello-world Next.js template, verify the chat-to-preview loop works end to end.

## Week 2-3 Target (Staycy Memory)

- Week 1: Foundation — conversations persist, change summaries generated, Tier 1+2 retrieval working
- Week 2: Intelligence — vector search (Tier 3), PM fact extraction (Tier 4), undo via git linkage
- Week 3: Polish — Staycy persona tuning, preference contradiction detection, confidence decay

## Key Risks

- **E2B dependency** — entire preview experience depends on E2B infrastructure. Have a fallback plan (iframe to Vercel preview URL with longer delay).
- **Claude code quality** — LLM may generate code that breaks the template. Need robust error recovery: show last working state, surface error to PM.
- **Memory retrieval latency** — must stay under 200ms p95. The HNSW index on pgvector is the bottleneck. Monitor as message volume grows.
- **Fact extraction accuracy** — wrong facts are worse than no facts. Spot-check weekly, especially early on.
- **Change summary accuracy** — if change summaries are imprecise, Staycy's recall and undo become unreliable.

## Tech Stack (Your Layer)

- Next.js 14 (App Router, Server Actions)
- Vercel AI SDK (streaming, tool calling)
- Claude Sonnet (code generation + fact extraction + session summaries)
- Morph (token-efficient diff apply)
- E2B SDK (sandbox management)
- Neon Postgres + pgvector (Staycy memory — shared builder database)
- OpenAI text-embedding-3-small (embedding generation)
- Upstash KV (rate limiting)
- GitHub API (Octokit — commits, repo management, diff fetching)
