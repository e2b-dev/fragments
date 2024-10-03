'use server'

import { Duration, ms } from '@/lib/duration'
import { Sandbox } from '@e2b/code-interpreter'
import { kv } from '@vercel/kv'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 7)

export async function publish(
  url: string,
  sbxId: string,
  duration: Duration,
  apiKey: string | undefined,
) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = nanoid()
    const expiration = ms(duration)
    await kv.set(`fragment:${id}`, url, { px: expiration })
    await Sandbox.setTimeout(sbxId, expiration, { apiKey })

    return {
      url: process.env.NEXT_PUBLIC_SITE_URL
        ? `https://${process.env.NEXT_PUBLIC_SITE_URL}/s/${id}`
        : `/s/${id}`,
    }
  }

  return {
    url,
  }
}
