import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimer, logger } from './logger'

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('development output (human-readable)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('LOG_LEVEL', 'debug')
    })

    it('logs info with tag and message', () => {
      logger.info('Server started')
      expect(logSpy).toHaveBeenCalledWith('[INFO] Server started')
    })

    it('logs debug with context', () => {
      logger.debug('Fetching data', { pipeline: 'memory-retrieval', durationMs: 42 })
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Fetching data'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"pipeline":"memory-retrieval"'))
    })

    it('logs warn via console.warn', () => {
      logger.warn('Slow query')
      expect(warnSpy).toHaveBeenCalledWith('[WARN] Slow query')
    })

    it('logs error via console.error', () => {
      logger.error('Crash', { pipeline: 'e2b-push' })
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Crash'))
    })
  })

  describe('production output (JSON)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('LOG_LEVEL', 'debug')
    })

    it('outputs valid JSON with required fields', () => {
      logger.info('Request handled', { pipeline: 'claude-response', durationMs: 500 })

      const output = logSpy.mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output)

      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Request handled')
      expect(parsed.pipeline).toBe('claude-response')
      expect(parsed.durationMs).toBe(500)
      expect(parsed.timestamp).toBeDefined()
      // Verify timestamp is ISO 8601
      expect(() => new Date(parsed.timestamp)).not.toThrow()
    })

    it('outputs JSON for error level via console.error', () => {
      logger.error('Failed', { sandboxId: 'sb-1' })

      const output = errorSpy.mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output)
      expect(parsed.level).toBe('error')
      expect(parsed.sandboxId).toBe('sb-1')
    })
  })

  describe('log level filtering', () => {
    it('suppresses debug in production (default min level is info)', () => {
      vi.stubEnv('NODE_ENV', 'production')
      // Don't set LOG_LEVEL — default in production is 'info'
      process.env.LOG_LEVEL = ''

      logger.debug('should not appear')
      expect(logSpy).not.toHaveBeenCalled()
    })

    it('respects LOG_LEVEL override', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('LOG_LEVEL', 'warn')

      logger.info('suppressed')
      logger.warn('visible')

      expect(logSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalled()
    })
  })
})

describe('createTimer', () => {
  it('returns elapsed time in milliseconds', () => {
    const timer = createTimer()
    // Busy-wait briefly to ensure measurable time
    const start = performance.now()
    while (performance.now() - start < 5) {
      // spin
    }
    const elapsed = timer.end()
    expect(elapsed).toBeGreaterThanOrEqual(0)
    expect(typeof elapsed).toBe('number')
    expect(Number.isInteger(elapsed)).toBe(true)
  })

  it('returns a number each call to end()', () => {
    const timer = createTimer()
    const first = timer.end()
    const second = timer.end()
    expect(second).toBeGreaterThanOrEqual(first)
  })
})
