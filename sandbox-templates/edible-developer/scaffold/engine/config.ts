import siteConfig from '@/site.config.json'
import { EngineClient, type EngineClientConfig } from './sdk'

const config: EngineClientConfig = {
  provider: siteConfig.engine.provider,
  apiBase: siteConfig.engine.apiBase,
  apiKey: process.env.NEXT_PUBLIC_BOOKING_API_KEY ?? undefined,
}

export const engine = new EngineClient(config)
export { siteConfig }
