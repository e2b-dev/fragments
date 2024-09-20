'use server'

import { Sandbox } from '@e2b/code-interpreter'
import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

const sandboxTimeout = 1 * 60 * 60 * 1000 // 1 hour

export async function publish(url: string, sbxId: string) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = nanoid(7)
    await kv.set(`fragment:${id}`, url)
    await Sandbox.setTimeout(sbxId, sandboxTimeout)

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
