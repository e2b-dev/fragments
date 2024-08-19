import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'

type Unit = "ms" | "s" | "m" | "h" | "d"
type Duration = `${number} ${Unit}` | `${number}${Unit}`

export default async function ratelimit (req: Request, maxRequests: number, window: Duration) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get('x-forwarded-for')
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(maxRequests, window)
    })

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`
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