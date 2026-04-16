import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { conversations } from './conversations'

describe('conversations schema', () => {
  const config = getTableConfig(conversations)

  it('has the correct table name', () => {
    expect(config.name).toBe('conversations')
  })

  it('has all required columns', () => {
    const colNames = config.columns.map((c) => c.name)
    expect(colNames).toEqual([
      'id',
      'pm_id',
      'site_repo',
      'started_at',
      'ended_at',
      'summary',
      'key_actions',
      'message_count',
      'created_at',
      'updated_at',
    ])
  })

  it('has id as uuid primary key', () => {
    const id = config.columns.find((c) => c.name === 'id')!
    expect(id.columnType).toBe('PgUUID')
    expect(id.primary).toBe(true)
    expect(id.hasDefault).toBe(true)
  })

  it('has pm_id as non-nullable text', () => {
    const col = config.columns.find((c) => c.name === 'pm_id')!
    expect(col.columnType).toBe('PgText')
    expect(col.notNull).toBe(true)
  })

  it('has site_repo as nullable text', () => {
    const col = config.columns.find((c) => c.name === 'site_repo')!
    expect(col.columnType).toBe('PgText')
    expect(col.notNull).toBe(false)
  })

  it('has message_count as non-nullable integer with default 0', () => {
    const col = config.columns.find((c) => c.name === 'message_count')!
    expect(col.columnType).toBe('PgInteger')
    expect(col.notNull).toBe(true)
    expect(col.hasDefault).toBe(true)
  })

  it('has created_at and updated_at timestamps', () => {
    for (const name of ['created_at', 'updated_at']) {
      const col = config.columns.find((c) => c.name === name)!
      expect(col.columnType).toBe('PgTimestamp')
      expect(col.notNull).toBe(true)
      expect(col.hasDefault).toBe(true)
    }
  })

  it('has idx_conversations_pm_id index', () => {
    const idx = config.indexes.find((i) => i.config.name === 'idx_conversations_pm_id')
    expect(idx).toBeDefined()
  })
})
