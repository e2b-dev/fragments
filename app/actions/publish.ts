'use server'

import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

export async function publish(url: string) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = nanoid(7)
    await kv.set(`fragment:${id}`, url)

    return {
      url: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/s/${id}`
        : `/s/${id}`,
    }
  }

  return {
    url,
  }
}
