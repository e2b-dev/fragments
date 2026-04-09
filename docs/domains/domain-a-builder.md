# Domain A: Builder Experience — Agent Brief

> Feed this file to your AI agent alongside `CLAUDE.md`. It defines what Domain A owns, can modify, and must not touch.

---

## Scope

You own the **PM-facing builder experience**: the Fragments fork that provides the chat + preview UI, E2B sandbox lifecycle management, Claude integration for code generation, the git commit pipeline, and session persistence for returning users.

## Key Deliverable

**A PM can prompt, see a live preview, undo changes, and publish their site.**

## What You Own

| Area | Details |
|---|---|
| Fragments fork | The Next.js 14 app that hosts the chat pane and preview iframe |
| Chat UI | Prompt input, streaming AI responses, conversation history |
| E2B lifecycle | Boot sandbox, push files, get preview URL, kill on idle/close |
| Claude integration | System prompt construction, Vercel AI SDK streaming, Morph for diff apply |
| Git commit flow | Every AI change = a commit. Undo = git revert. History = prompt log. |
| Session persistence | Returning PMs: detect existing repo, clone into fresh sandbox, reconstruct chat from git log |
| Publish trigger | PM clicks Publish -> call Domain D's deployment API |

## What You Consume (Do NOT Modify)

| Dependency | Owner | Contract |
|---|---|---|
| `.agent-rules.md` | Domain B | Defines what Claude can/cannot modify in the template. You build the system prompt from this file. |
| Template file structure | Domain B | The `src/` layout is fixed. Your file write paths must match. |
| E2B custom template image | Domain B (with C and D contributions) | You boot sandboxes from this image. Expect port 3000, Vite HMR. |
| Onseason PM config API | Domain D | You call this on session start to get ZEPL credentials, branding, feature flags. |
| Deployment API | Domain D | You call this when PM clicks Publish. |

## System Prompt Construction

The builder's system prompt for Claude is assembled from:
1. **Base instructions** — how to generate code diffs, Morph format
2. **`.agent-rules.md`** — what files are editable vs protected (from Domain B's template)
3. **`site.config.json`** — PM's branding, feature flags
4. **Display type interfaces** — so Claude knows the props contracts for components
5. **Current file tree** — so Claude knows what exists in the PM's repo

## Week 1 Target

Fork Fragments, strip to single persona ("Booking website"), boot an E2B sandbox with a hello-world Next.js template, verify the chat-to-preview loop works end to end.

## Key Risks

- **E2B dependency** — entire preview experience depends on E2B infrastructure. Have a fallback plan (iframe to Vercel preview URL with longer delay).
- **Claude code quality** — LLM may generate code that breaks the template. Need robust error recovery: show last working state, surface error to PM.
- **Session reconstruction** — rebuilding chat history from git commits is non-trivial. Commit messages must be structured enough to reconstruct the conversation.

## Tech Stack (Your Layer)

- Next.js 14 (App Router, Server Actions)
- Vercel AI SDK (streaming, tool calling)
- Claude Sonnet (code generation)
- Morph (token-efficient diff apply)
- E2B SDK (sandbox management)
- Upstash KV (rate limiting)
- GitHub API (Octokit — commits, repo management)
