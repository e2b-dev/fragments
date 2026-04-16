import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const conversations = pgTable(
  'conversations',
  {
    id: uuid().primaryKey().defaultRandom(),
    pmId: text('pm_id').notNull(),
    siteRepo: text('site_repo'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    summary: text(),
    keyActions: jsonb('key_actions'),
    messageCount: integer('message_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_conversations_pm_id').on(table.pmId)],
)
