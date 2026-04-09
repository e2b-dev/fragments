# Way of Work — Agent-Enabled Development Model

> Feed this to your agent so it understands how we coordinate. The Coherence Manager (Eddy) maintains this document.

---

## The Three-Layer Coordination Model

This project runs on three layers. The first two are collective discipline. The third is individual freedom. The whole model only works because the first two are strong enough that the third can be truly free.

### 1. Alignment (shared, non-negotiable)

What we believe and how things connect. This is the shared grammar — it's what makes independent people produce work that feels like one product.

- **Shared agent context** — `CLAUDE.md`, `docs/project-context.md`, domain briefs. Every agent sees the same architecture, boundaries, and conventions.
- **Architecture rules** — three-layer template boundary, Display types as contracts, protected adapter layer.
- **Domain contracts** — integration surfaces between A, B, C, D. Changing a contract triggers a sync before implementation.
- **Code conventions** — TypeScript strict, Tailwind, TanStack Query, conventional commits. Not suggestions — rules.

If you loosen this layer — let people skip the shared agent context, let integration surfaces be vague — the individual freedom creates chaos.

### 2. Convergence (shared, non-negotiable)

When and how we sync. This is how the team stays aligned without micromanaging each other. You don't pick your own convergence cadence — the whole team converges together, otherwise it doesn't work.

| Day | Mode | What Happens |
|---|---|---|
| **Monday** | Async | Post "aiming at" note in shared channel. Read what others posted. |
| **Tuesday** | Sync (30-60 min) | Show-and-merge, architecture alignment, or integration review. Mode picked Monday. |
| **Wednesday** | Deep build | No meetings. Heads down with agents. The big leaps happen here. |
| **Thursday** | Sync (30-60 min) | Second sync. Same format as Tuesday. Skip if nothing needs alignment. |
| **Friday** | Integration | Coherence Manager walks through the product end to end. Coherence notes go out for Monday. |

If you loosen this layer — let people skip syncs, skip Friday integration — the pieces drift apart silently.

### 3. Execution (personal, autonomous)

How you build within your domain. Your agents, your methods, your workflow. The team doesn't care how you got there — they care that your Monday intention becomes a working artifact by the sync session.

- Which agents you use (Claude Code, Cursor, Copilot, Windsurf, etc.)
- Which methodology you follow (BMad, GSD, Obra Superpowers, or none)
- Whether you prototype three approaches or go straight to building
- Whether you keep a kanban board, a todo list, or work from memory
- How you break down work within your domain

**The freedom to execute your own way is earned by the discipline of the first two layers. That's the deal.**

---

## Team Structure

- **3-4 developers**, each owning one or more outcome domains (A, B, C, D)
- **Coherence Manager (Eddy)** — watches for drift across domains, maintains shared context files, calls syncs when needed
- Each team member works with their own AI agent setup
- All agents consume the same shared context files — alignment is non-negotiable, tooling choice is personal

## The One Rule

**The artifact is the message.** Show the work, not the status. Every meaningful piece of work produces something the rest of the team can pull and run.

## Domain Ownership Rules

- **Within your domain:** merge directly, CI must pass
- **Crossing a boundary:** PR required, reviewed by affected domain owner + Coherence Manager
- **Contract changes:** follow the protocol in `docs/domain-contracts.md`
- **If unsure whether it crosses:** assume it crosses and check first

## Sync Session Types

| Type | When | Format |
|---|---|---|
| **Show-and-merge** | Default for Tue/Thu | Each domain shows running artifacts. Merge if clean. |
| **Architecture alignment** | When design decisions are pending | Domain owners present options, decide together. |
| **Integration review** | When boundary work is happening | Walk through contract changes, test cross-domain flows. |
| **Blocking sync** | Called by Coherence Manager | Drift detected that will cost more to fix later. Immediate resolution. |

## Agent Context Hygiene

Each team member is responsible for:

1. **Loading shared context** — Feed `CLAUDE.md` (auto-loaded by Claude Code) + your domain brief from `docs/domains/` to your agent. This is alignment, not optional.
2. **Respecting boundaries** — Your agent must know what it CAN and CANNOT modify (see domain briefs)
3. **Flagging drift** — If your agent generates something that feels like it crosses a boundary, pause and check `docs/domain-contracts.md`
4. **Updating shared context** — If you discover something the team needs to know, tell the Coherence Manager to update the relevant docs

## Coherence Manager Responsibilities

- Friday end-to-end walkthrough of the product
- Maintain `CLAUDE.md`, `docs/project-context.md`, `docs/domain-contracts.md`, and domain briefs
- Call blocking syncs when drift would be cheaper to fix now than later
- Review all cross-boundary PRs
- Ensure all domain agents are working from the same truth

## Escalation

If something blocks you and crosses a domain:
1. Post in shared channel with `[BLOCKED]` prefix
2. Tag the affected domain owner
3. If no response within 4 hours, the Coherence Manager calls a blocking sync
