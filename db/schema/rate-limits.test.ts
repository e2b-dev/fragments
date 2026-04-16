import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { rateLimits } from './rate-limits'

describe('rate_limits schema', () => {
  const config = getTableConfig(rateLimits)

  it('has the correct table name', () => {
    expect(config.name).toBe('rate_limits')
  })

  it('has all required columns', () => {
    const colNames = config.columns.map((c) => c.name)
    expect(colNames).toEqual([
      'id',
      'pm_id',
      'window_start',
      'message_count',
      'token_count',
      'created_at',
      'updated_at',
    ])
  })

  it('has window_start as non-nullable timestamp', () => {
    const col = config.columns.find((c) => c.name === 'window_start')!
    expect(col.columnType).toBe('PgTimestamp')
    expect(col.notNull).toBe(true)
  })

  it('has message_count and token_count as non-nullable integers with default 0', () => {
    for (const name of ['message_count', 'token_count']) {
      const col = config.columns.find((c) => c.name === name)!
      expect(col.columnType).toBe('PgInteger')
      expect(col.notNull).toBe(true)
      expect(col.hasDefault).toBe(true)
    }
  })

  it('has unique composite index idx_rate_limits_pm_id_window', () => {
    const idx = config.indexes.find((i) => i.config.name === 'idx_rate_limits_pm_id_window')
    expect(idx).toBeDefined()
    expect(idx!.config.unique).toBe(true)
  })

  it('has created_at and updated_at timestamps', () => {
    for (const name of ['created_at', 'updated_at']) {
      const col = config.columns.find((c) => c.name === name)!
      expect(col.columnType).toBe('PgTimestamp')
      expect(col.notNull).toBe(true)
      expect(col.hasDefault).toBe(true)
    }
  })
})
