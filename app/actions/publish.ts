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
  teamID: string | undefined,
  accessToken: string | undefined,
) {
  const expiration = ms(duration)
  await Sandbox.setTimeout(sbxId, expiration, {
    ...(teamID && accessToken
      ? {
          headers: {
            'X-Supabase-Team': teamID,
            'X-Supabase-Token': accessToken,
          },
        }
      : {}),
  })

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = nanoid()
    await kv.set(`fragment:${id}`, url, { px: expiration })

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
