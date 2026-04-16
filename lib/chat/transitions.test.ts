import { describe, expect, it } from 'vitest'
import {
  authModal,
  authModalReduced,
  chatMessage,
  chatMessageReduced,
  errorDim,
  errorDimReduced,
  getVariant,
  landingToBuilder,
  landingToBuilderReduced,
  previewPulse,
  previewPulseReduced,
  publishCard,
  publishCardReduced,
  undoCrossfade,
  undoCrossfadeReduced,
} from './transitions'
import type { MotionVariantSet, VariantName } from './transitions'

const ALL_VARIANT_NAMES: VariantName[] = [
  'authModal',
  'landingToBuilder',
  'previewPulse',
  'undoCrossfade',
  'publishCard',
  'chatMessage',
  'errorDim',
]

const standardVariants: Record<string, MotionVariantSet> = {
  authModal,
  landingToBuilder,
  previewPulse,
  undoCrossfade,
  publishCard,
  chatMessage,
  errorDim,
}

const reducedVariants: Record<string, MotionVariantSet> = {
  authModal: authModalReduced,
  landingToBuilder: landingToBuilderReduced,
  previewPulse: previewPulseReduced,
  undoCrossfade: undoCrossfadeReduced,
  publishCard: publishCardReduced,
  chatMessage: chatMessageReduced,
  errorDim: errorDimReduced,
}

describe('transitions', () => {
  describe('all 7 variant names are exported', () => {
    it.each(ALL_VARIANT_NAMES)('exports standard variant for %s', (name) => {
      expect(standardVariants[name]).toBeDefined()
    })

    it.each(ALL_VARIANT_NAMES)('exports reduced-motion variant for %s', (name) => {
      expect(reducedVariants[name]).toBeDefined()
    })
  })

  describe('standard variants have expected shape', () => {
    it('authModal has initial, animate, exit, and transition', () => {
      expect(authModal.initial).toBeDefined()
      expect(authModal.animate).toBeDefined()
      expect(authModal.exit).toBeDefined()
      expect(authModal.transition).toBeDefined()
    })

    it('landingToBuilder has initial, animate, exit, and transition', () => {
      expect(landingToBuilder.initial).toBeDefined()
      expect(landingToBuilder.animate).toBeDefined()
      expect(landingToBuilder.exit).toBeDefined()
      expect(landingToBuilder.transition).toBeDefined()
    })

    it('previewPulse has animate and transition', () => {
      expect(previewPulse.animate).toBeDefined()
      expect(previewPulse.transition).toBeDefined()
    })

    it('undoCrossfade has initial, animate, exit, and transition', () => {
      expect(undoCrossfade.initial).toBeDefined()
      expect(undoCrossfade.animate).toBeDefined()
      expect(undoCrossfade.exit).toBeDefined()
      expect(undoCrossfade.transition).toBeDefined()
    })

    it('publishCard has initial, animate, and transition', () => {
      expect(publishCard.initial).toBeDefined()
      expect(publishCard.animate).toBeDefined()
      expect(publishCard.transition).toBeDefined()
    })

    it('chatMessage has initial, animate, and transition', () => {
      expect(chatMessage.initial).toBeDefined()
      expect(chatMessage.animate).toBeDefined()
      expect(chatMessage.transition).toBeDefined()
    })

    it('errorDim has animate and transition', () => {
      expect(errorDim.animate).toBeDefined()
      expect(errorDim.transition).toBeDefined()
    })
  })

  describe('reduced-motion variants use instant duration', () => {
    it.each(ALL_VARIANT_NAMES)('%s reduced variant has duration: 0', (name) => {
      const variant = reducedVariants[name]
      expect(variant.transition).toEqual({ duration: 0 })
    })
  })

  describe('getVariant helper', () => {
    it('returns standard variant when prefersReducedMotion is false', () => {
      expect(getVariant('authModal', false)).toBe(authModal)
      expect(getVariant('chatMessage', false)).toBe(chatMessage)
      expect(getVariant('errorDim', false)).toBe(errorDim)
    })

    it('returns reduced variant when prefersReducedMotion is true', () => {
      expect(getVariant('authModal', true)).toBe(authModalReduced)
      expect(getVariant('chatMessage', true)).toBe(chatMessageReduced)
      expect(getVariant('errorDim', true)).toBe(errorDimReduced)
    })

    it('returns correct variant for all 7 names', () => {
      for (const name of ALL_VARIANT_NAMES) {
        const standard = getVariant(name, false)
        const reduced = getVariant(name, true)
        expect(standard).toBe(standardVariants[name])
        expect(reduced).toBe(reducedVariants[name])
      }
    })
  })
})
