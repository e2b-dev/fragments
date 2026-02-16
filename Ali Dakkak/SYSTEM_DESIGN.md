# Phase 2 — Production System Design (Fragments)

This document describes a production-ready system design for **Fragments** with the implemented feature:
**Code selection → attach as chat context** (right-click menu + attached context panel).

The goal is to explain how the system works in production, how it scales from **1k users to 10k+**, and how we handle reliability, cost, observability, CI/CD, and security.

---

## 1) Problem Summary

Users often ask the AI about code, but the AI does not know which exact lines the user means.

We need a reliable workflow where users can:
- select a part of the code
- attach it as context
- review the attached context before sending
- remove/clear the selection
- send the request with the selected snippet included every time

---

## 2) High-Level Architecture

### Main components
- **Client (Browser / React UI)**
  - Chat UI, code viewer, preview panel
  - Code selection + right-click menu
  - Attached code context panel

- **Next.js Web App (MERN UI + API layer)**
  - UI pages (React)
  - API routes: `/api/chat`, `/api/morph-chat`, `/api/sandbox`
  - Session/auth integration

- **LLM Orchestrator (Node/Express responsibilities inside API layer)**
  - Build prompt (includes attached code context)
  - Provider routing (OpenAI/Anthropic/etc.)
  - Rate limiting and caching
  - Safe input validation and payload limits

- **LLM Provider**
  - Streaming responses (token-based)
  - Errors, rate limits, timeouts handled by orchestrator

- **E2B Sandbox Runtime**
  - Create sandbox
  - Run/preview generated code
  - Return logs + preview URL

- **Database + Auth (Supabase / Postgres)**
  - Users/Teams
  - Sessions/roles
  - Request metadata and sandbox records

- **Redis / KV (Upstash/Vercel KV)**
  - Rate limit counters per user/team
  - Cache prompt/results (TTL)
  - Temporary attached selection/context (optional)

- **Observability (Sentry + logging + metrics)**
  - Logs, errors, tracing
  - Cost/token tracking

---

## 3) Core Data Flow (Request Lifecycle)

### Step-by-step
1. User selects code in the code viewer.
2. User right-clicks and chooses **Attach selection**.
3. UI stores the selection in a shared state (context provider).
4. User writes the prompt and hits **Send**.
5. `/api/chat` receives:
   - user message
   - optional files/images
   - optional attached code snippet (filename + language + text)
6. Orchestrator builds the final prompt:
   - conversation messages
   - **attached code block**
   - system instructions
7. Orchestrator sends the request to the chosen LLM provider.
8. LLM streams the response back to UI.
9. If a runnable fragment is produced, `/api/sandbox` creates an E2B sandbox:
   - runs code
   - returns preview URL + logs
10. UI shows preview in the right panel.

---

## 4) Scaling Plan (1k → 10k+)

### Target: 1k active users
- Keep services **stateless** and scale horizontally (more app instances)
- Use **Redis/KV** for rate limiting + caching
- Use CDN for static assets

### Target: 10k+ users
- Add a **Queue** for expensive work (sandbox creation / heavy requests)
- Implement **warm pool** of sandboxes (future optimization)
- Database:
  - connection pooling
  - move heavy analytics to async jobs
  - add read replicas later if needed

**Why:** LLM calls and sandbox spin-up are the main latency/cost drivers, so scaling focuses on caching + rate limits + queuing.

---

## 5) Bottlenecks & Mitigation

### Bottleneck 1: LLM latency and cost
Mitigation:
- Cache repeated prompts (TTL)
- Route to cheaper model when possible (draft vs final)
- Set strict token budgets per request

### Bottleneck 2: Sandbox creation time
Mitigation:
- Queue sandbox requests when traffic spikes
- Warm pool of pre-built sandboxes (future)

### Bottleneck 3: Large attached code context
Mitigation:
- Enforce max selection size (characters / lines)
- Truncate safely with a clear note
- Prefer “only selected snippet” over full file

### Bottleneck 4: DB connection pressure
Mitigation:
- Pooling
- Reduce sync writes
- Store only needed metadata

---

## 6) Reliability & Fault Tolerance

### External failures (LLM provider / E2B)
- Timeouts + retries with exponential backoff
- Circuit breaker per provider
- Fallback to another provider/model if available
- Graceful UI errors (clear message + retry button)

### Duplicate requests / double submits
- Use **idempotency keys** for `/api/chat` requests (recommended)
- Prevent duplicate sandbox creation for the same fragment

---

## 7) Monitoring & Observability

### Metrics (must-have)
- p95 latency for `/api/chat` and `/api/sandbox`
- error rates by endpoint and provider
- cache hit rate
- sandbox failures rate
- token usage + estimated cost

### Logs (must include)
- requestId, userId/teamId
- model/provider
- token count
- sandbox id / url

### Tracing
Track full path:
**UI → API → Provider → Sandbox**  
This helps diagnose where time is spent.

### Alerts
- provider error spikes
- budget overrun (token usage)
- sandbox failure spikes

---

## 8) Security & Multi-tenancy

### Authentication and authorization
- Use Supabase JWT auth
- Use RBAC (user roles / team roles)

### Data isolation
- All data access scoped by `teamId`
- Database policies enforce isolation

### Abuse protection
- Rate limits per team/user
- Quotas per team (daily/monthly token budget)
- Payload limits (prompt size, file size, attached snippet size)

### Sandbox safety
- Sandbox is isolated and short-lived (TTL cleanup)
- No secrets inside the sandbox
- Never send private keys to the client

---

## 9) CI/CD & Deployment Strategy

### CI checks on PR
- `npm run lint`
- `npm run build`
- Type checking
- Basic tests (if available)

### Environments
- **Staging**: auto deploy on merge to main
- **Production**: manual approval

### Release strategy
- Canary / gradual rollout for risky changes
- Rollback plan (previous deploy)

### Secrets management
- Use environment variables / secret manager
- No API keys inside repo

---

## 10) Cost Optimization (LLM + Sandbox)

Main cost drivers:
1. LLM tokens (input + output)
2. Sandbox runtime / compute time

Cost controls:
- token budget per request
- truncate large context
- caching with TTL
- model routing (cheap for simple tasks)
- quotas per team
- alert on cost spikes

---

## 11) Go-Live Plan (Simple)

1. Internal demo (small team)
2. Small beta (limited users + strict quotas)
3. Gradual rollout to more teams
4. Increase quotas only after monitoring stability and cost

---

## 12) Assumptions & Known Limitations

- Current implementation attaches **one snippet** at a time for clarity.
- Very large selections should be limited/truncated in production.
- Multi-snippet support is possible but increases UI and prompt complexity.
- Warm sandbox pool and queueing are recommended for 10k+ scale.

---

## 13) How to Present This in the Video (Short)

- Show the feature quickly (select → right click → attach → remove).
- Explain architecture in one slide:
  UI → API/Orchestrator → Provider → E2B Sandbox, plus DB + Redis + Observability.
- Mention scaling, reliability, security, and cost in simple terms.

---

## 14) link (Miro)

- https://miro.com/welcomeonboard/aXB4OHh5WTZOVEdISzNaeTZKUmJsRDRLYVV2Z0FNRWM4dHkwYk9HUXNzTENtQzFWUEJQK2VEMTNVYlR2cDdvdEpUSVBaNG53NkFleXV2UndoOTFyQm1kQXBNZlB1YldoMnVMVWlrUzVvaWlpbWQvRHZ2a1NicjdDVG5LKzBBcTNNakdSWkpBejJWRjJhRnhhb1UwcS9BPT0hdjE=?share_link_id=913649792771

---

**End.**
