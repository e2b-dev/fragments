import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const rateLimits = pgTable(
  'rate_limits',
  {
    id: uuid().primaryKey().defaultRandom(),
    pmId: text('pm_id').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true, mode: 'date' }).notNull(),
    messageCount: integer('message_count').notNull().default(0),
    tokenCount: integer('token_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('idx_rate_limits_pm_id_window').on(table.pmId, table.windowStart)],
)
