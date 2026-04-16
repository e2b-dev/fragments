import { describe, expect, it } from 'vitest'
import { Shimmer } from './shimmer'

describe('Shimmer', () => {
  it('is exported as a named function', () => {
    expect(typeof Shimmer).toBe('function')
    expect(Shimmer.name).toBe('Shimmer')
  })

  it('accepts no props (defaults)', () => {
    // Verify function accepts empty props — no throw on call signature check
    expect(() => Shimmer({})).not.toThrow()
  })

  it('accepts className prop', () => {
    const result = Shimmer({ className: 'w-full h-64' })
    expect(result).toBeDefined()
    expect(result.props.className).toContain('w-full h-64')
  })

  it('accepts variant="full" prop', () => {
    const result = Shimmer({ variant: 'full' })
    expect(result).toBeDefined()
  })

  it('accepts variant="overlay" prop', () => {
    const result = Shimmer({ variant: 'overlay' })
    expect(result).toBeDefined()
  })

  it('full variant does not include opacity modifier in gradient classes', () => {
    const result = Shimmer({ variant: 'full' })
    const className: string = result.props.className
    expect(className).not.toContain('/80')
  })

  it('overlay variant includes opacity modifier in gradient classes', () => {
    const result = Shimmer({ variant: 'overlay' })
    const className: string = result.props.className
    expect(className).toContain('/80')
  })

  it('includes animate-shimmer class', () => {
    const result = Shimmer({})
    expect(result.props.className).toContain('animate-shimmer')
  })

  it('includes motion-reduce utilities for accessibility', () => {
    const result = Shimmer({})
    expect(result.props.className).toContain('motion-reduce:animate-none')
  })

  it('has role="status" for accessibility', () => {
    const result = Shimmer({})
    expect(result.props.role).toBe('status')
  })

  it('has aria-label for accessibility', () => {
    const result = Shimmer({})
    expect(result.props['aria-label']).toBe('Loading')
  })
})
