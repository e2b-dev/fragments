export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type PipelineStage =
  | 'memory-retrieval'
  | 'claude-response'
  | 'shadow-validation'
  | 'e2b-push'
  | 'git-commit'
  | 'morph-apply'

export interface LogContext {
  pipeline?: PipelineStage
  durationMs?: number
  pmId?: string
  sandboxId?: string
  conversationId?: string
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined
  if (envLevel && envLevel in LOG_LEVELS) return envLevel
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '[unserializable]'
  }
}

function formatDev(level: LogLevel, message: string, context?: LogContext): string {
  const tag = `[${level.toUpperCase()}]`
  if (context && Object.keys(context).length > 0) {
    return `${tag} ${message} ${safeStringify(context)}`
  }
  return `${tag} ${message}`
}

function formatJson(level: LogLevel, message: string, context?: LogContext): string {
  return safeStringify({
    ...context,
    level,
    message,
    timestamp: new Date().toISOString(),
  })
}

function createLogFn(level: LogLevel): (message: string, context?: LogContext) => void {
  return (message: string, context?: LogContext) => {
    if (LOG_LEVELS[level] < LOG_LEVELS[getMinLevel()]) return

    const output = isProduction()
      ? formatJson(level, message, context)
      : formatDev(level, message, context)

    if (level === 'error') {
      console.error(output)
    } else if (level === 'warn') {
      console.warn(output)
    } else {
      console.log(output)
    }
  }
}

/** Singleton structured logger */
export const logger: Logger = {
  debug: createLogFn('debug'),
  info: createLogFn('info'),
  warn: createLogFn('warn'),
  error: createLogFn('error'),
}

/** High-resolution timer for pipeline stage instrumentation */
export function createTimer(): { end: () => number } {
  const start = performance.now()
  return {
    end: () => Math.round(performance.now() - start),
  }
}
