import { Redis } from '@upstash/redis'

// Replaces the deprecated @vercel/kv client. Reads the same KV_REST_API_URL /
// KV_REST_API_TOKEN variables, and is only created when both are set.
let client: Redis | undefined

export function getKv(): Redis {
  if (!client) {
    client = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return client
}
