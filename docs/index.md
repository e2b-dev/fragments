# AI Website Builder — Shared Documentation

> These files are the shared context that every team member feeds to their AI agents. The Coherence Manager (Eddy) keeps them current.

## How to Use These Docs

1. **Every agent** automatically loads `CLAUDE.md` (project root) — this has the critical rules
2. **Your domain brief** — feed `docs/domains/domain-X-*.md` to your agent for domain-specific context
3. **When crossing boundaries** — check `docs/domain-contracts.md` before implementing
4. **Full reference** — `docs/project-context.md` has the comprehensive architecture, Display types, and config schemas

## File Index

### Project-Wide
- [CLAUDE.md](../CLAUDE.md) — Auto-loaded agent instructions (architecture, conventions, domain map)
- [project-context.md](project-context.md) — Full shared context (architecture, Display types, file structure, config schemas, glossary)
- [domain-contracts.md](domain-contracts.md) — Integration surfaces between all four domains + change protocol
- [way-of-work.md](way-of-work.md) — Weekly cadence, sync types, agent context hygiene, escalation

### Domain Briefs
- [domain-a-builder.md](domains/domain-a-builder.md) — Builder experience (Fragments fork, E2B, Claude integration)
- [domain-b-template.md](domains/domain-b-template.md) — Website template + booking module (three-layer architecture)
- [domain-c-cms.md](domains/domain-c-cms.md) — CMS + content (Payload, blog, cross-module blocks)
- [domain-d-integration.md](domains/domain-d-integration.md) — ZEPL client + Onseason integration (SDK, auth, provisioning)

### Reference
- [agent-rules-template.md](agent-rules-template.md) — The `.agent-rules.md` that ships inside every PM's website
- [e2b-template-guide.md](e2b-template-guide.md) — How to build E2B sandbox templates
- [neon-auth-migration.md](neon-auth-migration.md) — Neon auth migration notes
