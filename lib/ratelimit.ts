import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'

export type Unit = "ms" | "s" | "m" | "h" | "d"
export type Duration = `${number} ${Unit}` | `${number}${Unit}`

export default async function ratelimit (key: string | null, maxRequests: number, window: Duration) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(maxRequests, window)
    })

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${key}`
    )

    if (!success) {
      return {
        amount: limit,
        reset,
        remaining
      }
    }
  }
}
