import { describe, expect, it } from 'vitest'
import {
  authModal,
  authModalReduced,
  builderEnterLeft,
  builderEnterLeftReduced,
  builderEnterRight,
  builderEnterRightReduced,
  chatMessage,
  chatMessageReduced,
  errorDim,
  errorDimReduced,
  getVariant,
  landingExit,
  landingExitReduced,
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
  'builderEnterLeft',
  'builderEnterRight',
  'chatMessage',
  'errorDim',
  'landingExit',
  'landingToBuilder',
  'previewPulse',
  'publishCard',
  'undoCrossfade',
]

const standardVariants: Record<string, MotionVariantSet> = {
  authModal,
  builderEnterLeft,
  builderEnterRight,
  chatMessage,
  errorDim,
  landingExit,
  landingToBuilder,
  previewPulse,
  publishCard,
  undoCrossfade,
}

const reducedVariants: Record<string, MotionVariantSet> = {
  authModal: authModalReduced,
  builderEnterLeft: builderEnterLeftReduced,
  builderEnterRight: builderEnterRightReduced,
  chatMessage: chatMessageReduced,
  errorDim: errorDimReduced,
  landingExit: landingExitReduced,
  landingToBuilder: landingToBuilderReduced,
  previewPulse: previewPulseReduced,
  publishCard: publishCardReduced,
  undoCrossfade: undoCrossfadeReduced,
}

describe('transitions', () => {
  describe('all 10 variant names are exported', () => {
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

    it('landingExit has initial, animate, exit, and transition', () => {
      expect(landingExit.initial).toBeDefined()
      expect(landingExit.animate).toBeDefined()
      expect(landingExit.exit).toBeDefined()
      expect(landingExit.transition).toBeDefined()
    })

    it('landingExit exit slides up (y: -30) and fades out', () => {
      expect(landingExit.exit).toMatchObject({ opacity: 0, y: -30 })
    })

    it('landingExit initial and animate are visible and at rest', () => {
      expect(landingExit.initial).toMatchObject({ opacity: 1, y: 0 })
      expect(landingExit.animate).toMatchObject({ opacity: 1, y: 0 })
    })

    it('landingExit transition is 400ms easeIn', () => {
      expect(landingExit.transition).toMatchObject({ duration: 0.4, ease: 'easeIn' })
    })

    it('builderEnterLeft has initial, animate, and transition', () => {
      expect(builderEnterLeft.initial).toBeDefined()
      expect(builderEnterLeft.animate).toBeDefined()
      expect(builderEnterLeft.transition).toBeDefined()
    })

    it('builderEnterLeft slides from left (x: -40)', () => {
      expect(builderEnterLeft.initial).toMatchObject({ opacity: 0, x: -40 })
      expect(builderEnterLeft.animate).toMatchObject({ opacity: 1, x: 0 })
    })

    it('builderEnterLeft transition is 500ms easeOut', () => {
      expect(builderEnterLeft.transition).toMatchObject({ duration: 0.5, ease: 'easeOut' })
    })

    it('builderEnterRight has initial, animate, and transition', () => {
      expect(builderEnterRight.initial).toBeDefined()
      expect(builderEnterRight.animate).toBeDefined()
      expect(builderEnterRight.transition).toBeDefined()
    })

    it('builderEnterRight slides from right edge (x: 100%)', () => {
      expect(builderEnterRight.initial).toMatchObject({ opacity: 0, x: '100%' })
      expect(builderEnterRight.animate).toMatchObject({ opacity: 1, x: 0 })
    })

    it('builderEnterRight transition is 400ms easeOut', () => {
      expect(builderEnterRight.transition).toMatchObject({ duration: 0.4, ease: 'easeOut' })
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

    it('returns correct variant for all 10 names', () => {
      for (const name of ALL_VARIANT_NAMES) {
        const standard = getVariant(name, false)
        const reduced = getVariant(name, true)
        expect(standard).toBe(standardVariants[name])
        expect(reduced).toBe(reducedVariants[name])
      }
    })
  })
})
