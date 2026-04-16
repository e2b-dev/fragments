import { index, jsonb, pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { conversations } from './conversations'

export const messages = pgTable(
  'messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id),
    role: text().notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 1536 }),
    commitSha: text('commit_sha'),
    filesChanged: jsonb('files_changed'),
    changeSummary: text('change_summary'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_messages_conversation_id').on(table.conversationId),
    index('idx_messages_embedding').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
)
