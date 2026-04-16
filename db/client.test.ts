import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb' },
}))

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}))

describe('db client', () => {
  it('exports db with schema attached', async () => {
    const { db } = await import('./client')
    expect(db).toBeDefined()
    expect(db.query).toBeDefined()
    expect(db.query.conversations).toBeDefined()
    expect(db.query.messages).toBeDefined()
    expect(db.query.pmFacts).toBeDefined()
    expect(db.query.rateLimits).toBeDefined()
  })
})
