import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { factTypeEnum, pmFacts } from './pm-facts'

describe('pm_facts schema', () => {
  const config = getTableConfig(pmFacts)

  it('has the correct table name', () => {
    expect(config.name).toBe('pm_facts')
  })

  it('has all required columns', () => {
    const colNames = config.columns.map((c) => c.name)
    expect(colNames).toEqual([
      'id',
      'pm_id',
      'type',
      'content',
      'confidence',
      'source_message_id',
      'superseded_by',
      'is_active',
      'created_at',
      'updated_at',
    ])
  })

  it('has factTypeEnum with correct values', () => {
    expect(factTypeEnum.enumValues).toEqual([
      'preference',
      'constraint',
      'brand',
      'site_state',
      'history',
      'staycy_note',
    ])
  })

  it('has confidence as non-nullable real with default 1.0', () => {
    const col = config.columns.find((c) => c.name === 'confidence')!
    expect(col.columnType).toBe('PgReal')
    expect(col.notNull).toBe(true)
    expect(col.hasDefault).toBe(true)
  })

  it('has is_active as non-nullable boolean with default true', () => {
    const col = config.columns.find((c) => c.name === 'is_active')!
    expect(col.columnType).toBe('PgBoolean')
    expect(col.notNull).toBe(true)
    expect(col.hasDefault).toBe(true)
  })

  it('has source_message_id FK to messages', () => {
    const fk = config.foreignKeys.find((f) => f.getName().includes('source_message_id'))
    expect(fk).toBeDefined()
  })

  it('has superseded_by self-referential FK', () => {
    const fk = config.foreignKeys.find((f) => f.getName().includes('superseded_by'))
    expect(fk).toBeDefined()
  })

  it('has composite index idx_pm_facts_pm_id_active', () => {
    const idx = config.indexes.find((i) => i.config.name === 'idx_pm_facts_pm_id_active')
    expect(idx).toBeDefined()
  })

  it('has created_at and updated_at timestamps', () => {
    for (const name of ['created_at', 'updated_at']) {
      const col = config.columns.find((c) => c.name === name)!
      expect(col.columnType).toBe('PgTimestamp')
      expect(col.notNull).toBe(true)
    }
  })
})
