'use server'

import { Sandbox } from '@e2b/code-interpreter'
import { kv } from '@vercel/kv'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdef', 7)
const sandboxTimeout = 1 * 60 * 60 * 1000 // 1 hour

export async function publish(url: string, sbxId: string) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = nanoid()
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
