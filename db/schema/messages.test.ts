import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { messages } from './messages'

describe('messages schema', () => {
  const config = getTableConfig(messages)

  it('has the correct table name', () => {
    expect(config.name).toBe('messages')
  })

  it('has all required columns', () => {
    const colNames = config.columns.map((c) => c.name)
    expect(colNames).toEqual([
      'id',
      'conversation_id',
      'role',
      'content',
      'embedding',
      'commit_sha',
      'files_changed',
      'change_summary',
      'created_at',
      'updated_at',
    ])
  })

  it('has embedding as vector(1536)', () => {
    const col = config.columns.find((c) => c.name === 'embedding')!
    expect(col.columnType).toBe('PgVector')
    expect(col.notNull).toBe(false)
  })

  it('has conversation_id FK to conversations', () => {
    expect(config.foreignKeys).toHaveLength(1)
    const fk = config.foreignKeys[0]!
    expect(fk.getName()).toBe('messages_conversation_id_conversations_id_fk')
  })

  it('has idx_messages_conversation_id index', () => {
    const idx = config.indexes.find((i) => i.config.name === 'idx_messages_conversation_id')
    expect(idx).toBeDefined()
  })

  it('has HNSW index on embedding', () => {
    const idx = config.indexes.find((i) => i.config.name === 'idx_messages_embedding')
    expect(idx).toBeDefined()
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
