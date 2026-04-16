import { env } from '@/lib/env'
import { AppError, ErrorCode } from '@/lib/errors'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type DbClient = ReturnType<typeof createClient>

let _db: DbClient | undefined

function createClient() {
  const url = env.DATABASE_URL
  if (!url) {
    throw new AppError({
      code: ErrorCode.CONFIG_INVALID,
      httpStatus: 500,
      userMessage: 'Database is not configured',
      message: 'DATABASE_URL is required but not set',
    })
  }
  return drizzle(neon(url), { schema })
}

/** Lazy-initialized Drizzle client — throws if DATABASE_URL is missing on first access */
export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    if (!_db) {
      _db = createClient()
    }
    return Reflect.get(_db, prop)
  },
})
