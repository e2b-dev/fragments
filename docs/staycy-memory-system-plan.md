# Stacy Memory System — Implementation Plan

> **Domain:** A (Builder experience)
> **Dependencies:** Neon Postgres (shared builder project), embedding API, Claude API
> **Estimated effort:** 2-3 weeks for full implementation across all tiers
> **Owner:** Domain A (Builder experience)

-----

## 1. Architecture overview

Stacy’s memory runs entirely on a single Neon Postgres database with the pgvector extension. No separate vector database, no knowledge graph, no external memory framework. Four tiers retrieve in parallel before every Claude call, assembling a context block in ~150-200ms.

```
PM sends prompt
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Memory orchestrator (~150-200ms total)          │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Tier 1   │ │ Tier 2   │ │ Tier 3        │   │
│  │ Working  │ │ Session  │ │ Vector search │   │
│  │ memory   │ │ summaries│ │ (pgvector)    │   │
│  │ ~5ms     │ │ ~10ms    │ │ ~80-100ms     │   │
│  └──────────┘ └──────────┘ └───────────────┘   │
│                                                  │
│  ┌──────────┐ ┌───────────────────────────────┐ │
│  │ Tier 4   │ │ Stacy's notes                 │ │
│  │ PM facts │ │ (special fact type)            │ │
│  │ ~10ms    │ │ ~5ms                           │ │
│  └──────────┘ └───────────────────────────────┘ │
│                                                  │
│  All queries run in parallel via Promise.all()   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
        Assembled context block
        injected into Claude system prompt
                   │
                   ▼
          Claude generates response
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Post-response pipeline (async, non-blocking)    │
│                                                  │
│  1. Save message pair to conversations DB        │
│  2. Generate + store embedding for user message  │
│  3. Extract any new PM facts (LLM call, async)   │
│  4. If session ending: generate session summary   │
│  5. Update Stacy's notes if preferences shifted   │
└─────────────────────────────────────────────────┘
```

-----

## 2. Database schema

All tables live in the **shared builder Neon project** (not per-customer Payload databases). One Postgres database, one connection string, pgvector extension enabled.

### 2.1 Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Neon supports pgvector natively — no additional setup needed.

### 2.2 Core tables

```sql
-- ============================================
-- CONVERSATIONS: Groups messages into sessions
-- ============================================
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id         TEXT NOT NULL,                  -- Onseason PM identifier
  site_repo     TEXT,                           -- GitHub repo slug
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,                    -- Set when session closes
  message_count INT NOT NULL DEFAULT 0,
  
  -- Session metadata
  summary       TEXT,                           -- LLM-generated session summary (Tier 2)
  key_actions   JSONB DEFAULT '[]'::jsonb,      -- What the PM built/changed this session
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_pm ON conversations(pm_id, created_at DESC);

-- ============================================
-- MESSAGES: Every prompt and response, verbatim
-- ============================================
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id),
  pm_id             TEXT NOT NULL,
  
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  
  -- Git linkage
  commit_sha        TEXT,                       -- Links to git when code changed
  files_changed     TEXT[],                     -- Which files this message affected
  
  -- Vector embedding for semantic search (Tier 3)
  embedding         vector(1536),               -- text-embedding-3-small produces 1536 dims
  
  -- Metadata
  metadata          JSONB DEFAULT '{}'::jsonb,  -- model, tokens, latency, rejected flag, etc.
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_pm ON messages(pm_id, created_at DESC);

-- HNSW index for fast approximate nearest neighbor search
-- Use cosine distance (<=>) which is standard for text-embedding-3-small
CREATE INDEX idx_messages_embedding ON messages 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================
-- PM_FACTS: Extracted knowledge about each PM (Tier 4)
-- ============================================
CREATE TABLE pm_facts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id                 TEXT NOT NULL,
  
  fact_type             TEXT NOT NULL CHECK (fact_type IN (
    'preference',       -- "prefers serif fonts", "likes warm palettes"
    'constraint',       -- "never use dark backgrounds", "must have 3-column grid"
    'brand',            -- "brand colors are #1a365d and #f4e8d0", "logo is /logo.svg"
    'site_state',       -- "homepage has hero + testimonials + listing grid"
    'history',          -- "tried and rejected a magazine-style blog layout"
    'stacy_note'        -- Stacy's own observations about this PM
  )),
  
  content               TEXT NOT NULL,          -- The fact itself, natural language
  confidence            REAL NOT NULL DEFAULT 0.8, -- 0.0-1.0, decays if contradicted
  
  -- Provenance
  source_conversation_id UUID REFERENCES conversations(id),
  source_message_id      UUID REFERENCES messages(id),
  
  -- Lifecycle
  is_active             BOOLEAN NOT NULL DEFAULT true,  -- Soft delete when contradicted
  superseded_by         UUID REFERENCES pm_facts(id),   -- Points to the fact that replaced this one
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pm_facts_pm ON pm_facts(pm_id, fact_type) WHERE is_active = true;
```

### 2.3 Why this schema works

**Messages carry their own embeddings.** No separate vector table to sync. When a message is saved, its embedding is stored in the same row. The HNSW index on `embedding` column gives sub-100ms approximate nearest neighbor search over millions of rows.

**PM facts are simple rows, not a graph.** Each fact is a self-contained statement with a type, a confidence score, and provenance (which conversation/message it was extracted from). When a new fact contradicts an old one, the old fact is soft-deleted and linked to its replacement via `superseded_by`. This gives you a complete history of how Stacy’s understanding of each PM evolved over time.

**Stacy’s notes are just a special fact_type.** They’re stored alongside PM preferences and constraints, queried the same way, but written by Stacy (not extracted from PM prompts). This keeps the schema simple while giving Stacy her own “notebook.”

-----

## 3. Embedding pipeline

### 3.1 Which embedding model

Use **OpenAI text-embedding-3-small** (1536 dimensions).

- Cost: $0.02 per 1M tokens (~$0.00002 per message)
- Latency: ~50-80ms per embedding
- Quality: Strong semantic similarity for conversational text
- Why not text-embedding-3-large: 3072 dims doubles storage and index size with marginal quality improvement for your use case

Alternative if you want zero external dependency: **Voyage AI voyage-3-lite** (512 dims, slightly faster, slightly cheaper). Lower dimensionality means smaller HNSW index and faster queries at the cost of slightly less semantic precision.

### 3.2 Embedding generation

Embed **user messages only** (not assistant responses). The PM’s prompt is what you want to retrieve by — “make the hero section full-bleed” is the searchable memory, not Claude’s code output.

```typescript
// lib/memory/embeddings.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}
```

### 3.3 When embeddings are generated

Embeddings are generated **asynchronously after the response is sent to the PM.** Never block the response pipeline for embedding generation.

```
PM sends prompt → Claude responds → PM sees preview update
                                          │
                                    (async, non-blocking)
                                          │
                                          ▼
                              Generate embedding for PM's prompt
                              Store in messages.embedding column
```

This means the very first prompt of a session won’t be searchable by vector similarity until a few seconds after it’s sent. That’s fine — you’d never search for a message in the same turn it was sent.

-----

## 4. Memory orchestrator

This is the core retrieval function that runs before every Claude call. All queries run in parallel.

```typescript
// lib/memory/orchestrator.ts

import { sql } from '@neondatabase/serverless';
import { generateEmbedding } from './embeddings';

interface MemoryContext {
  workingMemory: Message[];           // Last N messages of current session
  sessionSummaries: SessionSummary[]; // Last 3-5 past sessions
  relevantMemories: Message[];        // Vector-similar past messages
  pmFacts: PmFact[];                  // Extracted preferences/constraints
  stacyNotes: PmFact[];              // Stacy's own observations
}

export async function retrieveMemoryContext(
  pmId: string,
  conversationId: string,
  currentPrompt: string
): Promise<MemoryContext> {
  
  // Generate embedding for the current prompt (for vector search)
  const promptEmbedding = await generateEmbedding(currentPrompt);
  
  // Run all retrievals in parallel
  const [
    workingMemory,
    sessionSummaries,
    relevantMemories,
    pmFacts,
    stacyNotes,
  ] = await Promise.all([
    
    // Tier 1: Last 10 messages from current session
    sql`
      SELECT role, content, commit_sha, files_changed, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT 10
    `,
    
    // Tier 2: Last 5 session summaries (excluding current)
    sql`
      SELECT summary, key_actions, started_at, ended_at
      FROM conversations
      WHERE pm_id = ${pmId}
        AND id != ${conversationId}
        AND summary IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `,
    
    // Tier 3: Top 5 semantically similar past messages
    sql`
      SELECT content, commit_sha, created_at, 
             1 - (embedding <=> ${JSON.stringify(promptEmbedding)}::vector) as similarity
      FROM messages
      WHERE pm_id = ${pmId}
        AND conversation_id != ${conversationId}
        AND role = 'user'
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(promptEmbedding)}::vector
      LIMIT 5
    `,
    
    // Tier 4: All active facts about this PM
    sql`
      SELECT fact_type, content, confidence, updated_at
      FROM pm_facts
      WHERE pm_id = ${pmId}
        AND is_active = true
        AND fact_type != 'stacy_note'
      ORDER BY confidence DESC, updated_at DESC
    `,
    
    // Stacy's notes (separate for prompt construction)
    sql`
      SELECT content, updated_at
      FROM pm_facts
      WHERE pm_id = ${pmId}
        AND is_active = true
        AND fact_type = 'stacy_note'
      ORDER BY updated_at DESC
      LIMIT 5
    `,
  ]);
  
  return {
    workingMemory: workingMemory.rows.reverse(), // Chronological order
    sessionSummaries: sessionSummaries.rows,
    relevantMemories: relevantMemories.rows,
    pmFacts: pmFacts.rows,
    stacyNotes: stacyNotes.rows,
  };
}
```

### 4.1 Assembling the context block

The memory context is injected into Claude’s system prompt. Budget: **~1,500 tokens for memory context** out of a ~100K context window. This leaves the vast majority for the current codebase, agent rules, and Claude’s working space.

```typescript
// lib/memory/context-builder.ts

export function buildMemoryBlock(ctx: MemoryContext): string {
  const sections: string[] = [];
  
  // Stacy's notes (most personal, goes first)
  if (ctx.stacyNotes.length > 0) {
    sections.push(
      `## Your notes about this PM\n` +
      ctx.stacyNotes.map(n => `- ${n.content}`).join('\n')
    );
  }
  
  // PM facts (preferences, constraints, brand)
  if (ctx.pmFacts.length > 0) {
    const grouped = groupBy(ctx.pmFacts, 'fact_type');
    
    if (grouped.preference?.length) {
      sections.push(
        `## PM preferences\n` +
        grouped.preference.map(f => `- ${f.content}`).join('\n')
      );
    }
    if (grouped.constraint?.length) {
      sections.push(
        `## PM constraints (respect these)\n` +
        grouped.constraint.map(f => `- ${f.content}`).join('\n')
      );
    }
    if (grouped.brand?.length) {
      sections.push(
        `## Brand details\n` +
        grouped.brand.map(f => `- ${f.content}`).join('\n')
      );
    }
    if (grouped.site_state?.length) {
      sections.push(
        `## Current site state\n` +
        grouped.site_state.map(f => `- ${f.content}`).join('\n')
      );
    }
    if (grouped.history?.length) {
      sections.push(
        `## Past decisions\n` +
        grouped.history.map(f => `- ${f.content}`).join('\n')
      );
    }
  }
  
  // Session summaries
  if (ctx.sessionSummaries.length > 0) {
    sections.push(
      `## Recent sessions\n` +
      ctx.sessionSummaries.map(s => {
        const date = new Date(s.started_at).toLocaleDateString();
        return `**${date}:** ${s.summary}`;
      }).join('\n\n')
    );
  }
  
  // Relevant past moments (from vector search)
  if (ctx.relevantMemories.length > 0) {
    const relevant = ctx.relevantMemories.filter(m => m.similarity > 0.75);
    if (relevant.length > 0) {
      sections.push(
        `## Relevant past requests\n` +
        relevant.map(m => {
          const date = new Date(m.created_at).toLocaleDateString();
          return `- (${date}) "${m.content}"${m.commit_sha ? ' → applied' : ' → no change'}`;
        }).join('\n')
      );
    }
  }
  
  return sections.join('\n\n');
}
```

### 4.2 Token budget management

The context builder should count tokens and truncate if the memory block exceeds the budget. Oldest session summaries get dropped first, then relevant memories, then lower-confidence facts. PM constraints and Stacy’s notes are never truncated — they’re the highest-value context.

```typescript
const MAX_MEMORY_TOKENS = 1500;

export function buildMemoryBlockWithBudget(ctx: MemoryContext): string {
  let block = buildMemoryBlock(ctx);
  let tokenCount = estimateTokens(block);
  
  // Progressive truncation if over budget
  while (tokenCount > MAX_MEMORY_TOKENS) {
    if (ctx.sessionSummaries.length > 2) {
      ctx.sessionSummaries.pop(); // Drop oldest summary
    } else if (ctx.relevantMemories.length > 0) {
      ctx.relevantMemories.pop(); // Drop least similar memory
    } else {
      // Hard truncate as last resort
      block = block.slice(0, MAX_MEMORY_TOKENS * 4); // ~4 chars per token
      break;
    }
    block = buildMemoryBlock(ctx);
    tokenCount = estimateTokens(block);
  }
  
  return block;
}
```

-----

## 5. Post-response pipeline (write path)

After Claude responds and the PM sees their preview update, the write pipeline runs asynchronously.

### 5.1 Save message pair + generate embedding

```typescript
// lib/memory/write.ts

export async function saveInteraction(params: {
  conversationId: string;
  pmId: string;
  userMessage: string;
  assistantMessage: string;
  commitSha?: string;
  filesChanged?: string[];
  metadata?: Record<string, any>;
}) {
  // Generate embedding for user message (async but fast)
  const embedding = await generateEmbedding(params.userMessage);
  
  // Save both messages in a transaction
  await sql.begin(async (tx) => {
    // User message with embedding
    await tx`
      INSERT INTO messages (conversation_id, pm_id, role, content, embedding, metadata, created_at)
      VALUES (${params.conversationId}, ${params.pmId}, 'user', ${params.userMessage},
              ${JSON.stringify(embedding)}::vector, ${params.metadata || {}}, now())
    `;
    
    // Assistant message (no embedding — we don't search assistant responses)
    await tx`
      INSERT INTO messages (conversation_id, pm_id, role, content, commit_sha, 
                           files_changed, metadata, created_at)
      VALUES (${params.conversationId}, ${params.pmId}, 'assistant', ${params.assistantMessage},
              ${params.commitSha}, ${params.filesChanged || null}, ${params.metadata || {}}, now())
    `;
    
    // Increment conversation message count
    await tx`
      UPDATE conversations SET message_count = message_count + 2 WHERE id = ${params.conversationId}
    `;
  });
}
```

### 5.2 Fact extraction (runs periodically, not every message)

Extracting PM facts on every single message would be expensive (an extra Claude call per prompt). Instead, run fact extraction:

- Every 5th user message within a session
- At session end (always)
- When the PM explicitly states a preference (“I don’t like dark themes”, “always use this font”)

```typescript
// lib/memory/fact-extraction.ts

const FACT_EXTRACTION_PROMPT = `You are analyzing a conversation between a property manager and Stacy, 
an AI website builder assistant. Extract any facts about the PM that would be useful to remember 
for future sessions.

For each fact, classify it as one of:
- preference: A design, style, or UX preference ("likes warm colors", "prefers minimal layouts")
- constraint: Something to avoid or always include ("never use dark mode", "always show phone number in header")
- brand: Brand-specific details ("brand color is #1a365d", "business name is Adriatic Luxury Villas")
- site_state: Current state of their website ("homepage has hero + testimonials + 3-column listing grid")
- history: A design decision or attempt worth remembering ("tried a magazine blog layout but reverted to grid")

Return a JSON array of facts. If no new facts are present, return an empty array.
Only extract facts that are NEW — not already covered by existing facts.

Existing facts about this PM:
{existing_facts}

Recent conversation messages:
{recent_messages}

Return ONLY valid JSON, no explanation:
[{"type": "preference", "content": "prefers serif fonts for headings", "confidence": 0.9}]`;

export async function extractFacts(
  pmId: string,
  conversationId: string,
  recentMessages: Message[],
  existingFacts: PmFact[]
): Promise<void> {
  const prompt = FACT_EXTRACTION_PROMPT
    .replace('{existing_facts}', existingFacts.map(f => `- [${f.fact_type}] ${f.content}`).join('\n'))
    .replace('{recent_messages}', recentMessages.map(m => `${m.role}: ${m.content}`).join('\n'));
  
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const facts = JSON.parse(response.content[0].text);
  
  for (const fact of facts) {
    // Check if this contradicts an existing fact
    const existing = existingFacts.find(
      f => f.fact_type === fact.type && isSemanticallyContradictory(f.content, fact.content)
    );
    
    if (existing) {
      // Supersede the old fact
      const newFactId = crypto.randomUUID();
      await sql`UPDATE pm_facts SET is_active = false, superseded_by = ${newFactId} WHERE id = ${existing.id}`;
      await sql`
        INSERT INTO pm_facts (id, pm_id, fact_type, content, confidence, source_conversation_id)
        VALUES (${newFactId}, ${pmId}, ${fact.type}, ${fact.content}, ${fact.confidence}, ${conversationId})
      `;
    } else {
      // New fact
      await sql`
        INSERT INTO pm_facts (pm_id, fact_type, content, confidence, source_conversation_id)
        VALUES (${pmId}, ${fact.type}, ${fact.content}, ${fact.confidence}, ${conversationId})
      `;
    }
  }
}
```

### 5.3 Session summary generation

When a session ends (PM closes tab, idle timeout, or explicit “done for now”), generate a session summary.

```typescript
// lib/memory/session-summary.ts

const SESSION_SUMMARY_PROMPT = `Summarize this editing session between a property manager and Stacy.
Write 2-3 sentences capturing: what the PM worked on, what decisions were made, what was tried 
and rejected. Also list the key actions as a JSON array.

Conversation:
{messages}

Return JSON:
{
  "summary": "The PM redesigned the homepage hero...",
  "key_actions": ["redesigned homepage hero", "added testimonials section", "rejected dark color scheme"]
}`;

export async function generateSessionSummary(
  conversationId: string
): Promise<void> {
  const messages = await sql`
    SELECT role, content FROM messages 
    WHERE conversation_id = ${conversationId} 
    ORDER BY created_at
  `;
  
  const prompt = SESSION_SUMMARY_PROMPT
    .replace('{messages}', messages.rows.map(m => `${m.role}: ${m.content}`).join('\n'));
  
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const result = JSON.parse(response.content[0].text);
  
  await sql`
    UPDATE conversations 
    SET summary = ${result.summary}, 
        key_actions = ${JSON.stringify(result.key_actions)}::jsonb,
        ended_at = now()
    WHERE id = ${conversationId}
  `;
}
```

### 5.4 Stacy’s self-notes

After session summary, Stacy writes a note about the PM. This runs only at session end.

```typescript
// lib/memory/stacy-notes.ts

const STACY_NOTE_PROMPT = `You are Stacy, an AI website design assistant. You just finished an editing 
session with a property manager. Based on the session and what you already know about them, write a 
brief personal note to yourself about this PM — their working style, preferences, personality, 
anything that would help you work with them better next time.

Be specific and practical. "Maria is detail-oriented" is less useful than "Maria prefers to iterate 
in small steps — big redesigns overwhelm her. She responds well when I show my reasoning."

Keep it to 2-3 sentences max.

Existing notes about this PM:
{existing_notes}

Session summary:
{session_summary}

Your note:`;

export async function generateStacyNote(
  pmId: string,
  conversationId: string,
  sessionSummary: string,
  existingNotes: PmFact[]
): Promise<void> {
  const prompt = STACY_NOTE_PROMPT
    .replace('{existing_notes}', existingNotes.map(n => `- ${n.content}`).join('\n') || 'None yet')
    .replace('{session_summary}', sessionSummary);
  
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const note = response.content[0].text.trim();
  
  // Deactivate oldest note if there are already 5
  // (keep notes fresh, not accumulating forever)
  const noteCount = await sql`
    SELECT count(*) as c FROM pm_facts 
    WHERE pm_id = ${pmId} AND fact_type = 'stacy_note' AND is_active = true
  `;
  
  if (noteCount.rows[0].c >= 5) {
    await sql`
      UPDATE pm_facts SET is_active = false 
      WHERE id = (
        SELECT id FROM pm_facts 
        WHERE pm_id = ${pmId} AND fact_type = 'stacy_note' AND is_active = true
        ORDER BY created_at ASC LIMIT 1
      )
    `;
  }
  
  await sql`
    INSERT INTO pm_facts (pm_id, fact_type, content, confidence, source_conversation_id)
    VALUES (${pmId}, 'stacy_note', ${note}, 1.0, ${conversationId})
  `;
}
```

-----

## 6. Stacy’s system prompt structure

Here’s how memory integrates into Stacy’s overall system prompt:

```typescript
// lib/stacy/system-prompt.ts

export function buildStacySystemPrompt(params: {
  memoryBlock: string;
  agentRules: string;
  siteConfig: SiteConfig;
  currentFileTree: string;
}): string {
  return `You are Stacy, an AI website design assistant for property managers. You help PMs 
build and customize their direct-booking websites through conversation.

## Your personality
- Warm, confident, opinionated about design (in a helpful way)
- You suggest improvements proactively, not just execute instructions
- You explain your design reasoning briefly unless the PM asks for detail
- You remember what this PM likes and adapt your suggestions accordingly
- When a PM's request would hurt their site's conversion, you say so respectfully

## Your memory
${params.memoryBlock}

## Agent rules (what you can and cannot modify)
${params.agentRules}

## Current site configuration
${JSON.stringify(params.siteConfig, null, 2)}

## Current file tree
${params.currentFileTree}

## Instructions
- Reference your memory naturally — don't say "according to my records" or "I remember from our database"
- If the PM asks for something you know they rejected before, mention it: "We tried something similar last time and you weren't happy with it — want me to take a different approach?"
- If you're about to make a change that conflicts with a known preference, flag it: "This would use a dark background, which you've told me you prefer to avoid — should I go ahead anyway?"
- Update your understanding of the PM's preferences as you go — you'll remember for next time
`;
}
```

-----

## 7. Cost estimate

### Per-message costs (memory system only)

|Operation                      |Cost                          |When                           |
|-------------------------------|------------------------------|-------------------------------|
|Embedding generation           |~$0.00002                     |Every user message             |
|Fact extraction (Claude Sonnet)|~$0.003                       |Every 5th message + session end|
|Session summary (Claude Sonnet)|~$0.002                       |Session end only               |
|Stacy note (Claude Sonnet)     |~$0.001                       |Session end only               |
|pgvector query                 |~$0 (included in Neon compute)|Every prompt                   |

### Per-session costs (assuming 15 prompts per session)

- Embeddings: 15 × $0.00002 = **$0.0003**
- Fact extraction: 3 runs × $0.003 = **$0.009**
- Session summary: 1 × $0.002 = **$0.002**
- Stacy note: 1 × $0.001 = **$0.001**
- **Total memory overhead per session: ~$0.012**

At 100 PMs with 4 sessions/month each: **~$4.80/month** for the entire memory system. Negligible.

### Storage

- Messages: ~500 bytes per message × 60 messages per session × 4 sessions/month = ~120KB per PM per month
- Embeddings: 1536 floats × 4 bytes × 30 user messages per month = ~184KB per PM per month
- PM facts: negligible (<1KB per PM)
- At 100 PMs after 12 months: ~3.6 GB total. Well within Neon’s storage tiers.

-----

## 8. Implementation sequence

### Week 1: Foundation (Tier 1 + Tier 2)

**Goal: Conversations persist across sessions, Stacy remembers recent history**

- [ ] Create Neon shared project for builder infrastructure
- [ ] Enable pgvector extension
- [ ] Run schema migrations (conversations, messages, pm_facts tables)
- [ ] Implement message save on every prompt/response exchange
- [ ] Implement session lifecycle (create on first prompt, close on idle/tab close)
- [ ] Implement session summary generation on session end
- [ ] Wire Tier 1 retrieval (last N messages from current session)
- [ ] Wire Tier 2 retrieval (past session summaries)
- [ ] Build memory context block and inject into Claude system prompt
- [ ] Test: PM opens builder → chats → closes → returns → sees summary of last session in Stacy’s context

### Week 2: Intelligence (Tier 3 + Tier 4)

**Goal: Stacy remembers preferences and can recall any past moment**

- [ ] Integrate OpenAI embedding API (text-embedding-3-small)
- [ ] Generate and store embeddings on every user message (async post-response)
- [ ] Build HNSW index on messages.embedding
- [ ] Implement vector similarity search (Tier 3 retrieval)
- [ ] Implement fact extraction pipeline (every 5th message + session end)
- [ ] Implement fact contradiction detection and superseding
- [ ] Wire Tier 4 retrieval (active PM facts)
- [ ] Implement Stacy’s self-note generation at session end
- [ ] Update memory orchestrator to run all 4 tiers in parallel
- [ ] Update context builder with token budget management
- [ ] Test: PM says “I don’t like dark themes” → fact extracted → next session, Stacy avoids suggesting dark designs

### Week 3: Polish + Stacy persona

**Goal: The memory feels natural, Stacy feels like a real designer who knows you**

- [ ] Tune Stacy’s system prompt — persona, tone, how she references memory
- [ ] Add explicit preference callback: when PM request contradicts a known preference, Stacy flags it
- [ ] Add “we tried this before” detection: if vector search finds a similar past prompt, Stacy references it
- [ ] Implement confidence decay: facts not reinforced in 30 days drop confidence score
- [ ] Build a simple admin view: what does Stacy “know” about a given PM (for debugging, support)
- [ ] Load test: 20 concurrent sessions, verify memory retrieval stays under 200ms p95
- [ ] Edge case testing: new PM with zero history, PM with 50+ sessions of history, PM who contradicts themselves frequently

-----

## 9. Monitoring and observability

Track these metrics from day one:

|Metric                      |Target                                           |Why it matters                                  |
|----------------------------|-------------------------------------------------|------------------------------------------------|
|Memory retrieval p95 latency|< 200ms                                          |Stacy must feel instant                         |
|Fact extraction accuracy    |> 85% (spot-check)                               |Wrong facts are worse than no facts             |
|Vector search relevance     |Top-3 results should be relevant 80%+ of the time|Irrelevant memories waste context tokens        |
|Session summary quality     |Spot-check weekly                                |Summaries that miss key decisions degrade Tier 2|
|Context block token usage   |< 1,500 tokens average                           |Over-budget = other context gets crowded out    |
|Embedding storage growth    |Monitor monthly                                  |Plan Neon storage tier accordingly              |

-----

## 10. Future enhancements (post-v1)

**Cross-PM pattern learning.** When 50+ PMs have accumulated preferences, analyze patterns: “PMs who manage luxury villas in Dubrovnik prefer serif fonts 73% of the time.” This doesn’t require a knowledge graph — it’s an analytics query over pm_facts. But it enables Stacy to make smarter default suggestions for new PMs based on their segment.

**Proactive suggestions.** Stacy notices a PM hasn’t updated their site since April and peak season starts in June: “Hey, want to refresh your homepage for summer? Last year you had great success with the beach hero photo.” This requires a lightweight cron job that checks site activity and PM patterns.

**Graph layer (if needed).** If cross-PM relationships become genuinely complex (PM A’s site references PM B’s site, shared portfolios, management companies with multiple PMs), then evaluate Graphiti/Zep as a layer on top of this Postgres foundation. The schema is designed to be compatible — pm_facts can be exported as graph nodes with edges derived from source_conversation linkages.