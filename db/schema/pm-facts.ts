import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { boolean, index, pgEnum, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { messages } from './messages'

export const factTypeEnum = pgEnum('fact_type', [
  'preference',
  'constraint',
  'brand',
  'site_state',
  'history',
  'staycy_note',
])

export const pmFacts = pgTable(
  'pm_facts',
  {
    id: uuid().primaryKey().defaultRandom(),
    pmId: text('pm_id').notNull(),
    type: factTypeEnum().notNull(),
    content: text().notNull(),
    confidence: real().notNull().default(1.0),
    sourceMessageId: uuid('source_message_id').references(() => messages.id),
    supersededBy: uuid('superseded_by').references((): AnyPgColumn => pmFacts.id),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_pm_facts_pm_id_active').on(table.pmId, table.isActive)],
)
