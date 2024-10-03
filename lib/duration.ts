// Taken from https://github.com/upstash/ratelimit/blob/main/src/duration.ts

type Unit = 'ms' | 's' | 'm' | 'h' | 'd'
export type Duration = `${number} ${Unit}` | `${number}${Unit}`

/**
 * Convert a human readable duration to milliseconds
 */
export function ms(d: Duration): number {
  const match = d.match(/^(\d+)\s?(ms|s|m|h|d)$/)
  if (!match) {
    throw new Error(`Unable to parse window size: ${d}`)
  }
  const time = Number.parseInt(match[1])
  const unit = match[2] as Unit

  switch (unit) {
    case 'ms': {
      return time
    }
    case 's': {
      return time * 1000
    }
    case 'm': {
      return time * 1000 * 60
    }
    case 'h': {
      return time * 1000 * 60 * 60
    }
    case 'd': {
      return time * 1000 * 60 * 60 * 24
    }

    default: {
      throw new Error(`Unable to parse window size: ${d}`)
    }
  }
}
