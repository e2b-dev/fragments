import type { Transition, Variant } from 'motion'

export interface MotionVariantSet {
  initial?: Variant
  animate?: Variant
  exit?: Variant
  transition?: Transition
}

const INSTANT: Transition = { duration: 0 }

function opacityOnly(opacity: number): Variant {
  return { opacity }
}

// --- Auth Modal: fade + scale, 300ms ---

export const authModal: MotionVariantSet = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
}

export const authModalReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  exit: opacityOnly(0),
  transition: INSTANT,
}

// --- Landing to Builder: hero fades, split pane slides, 500-600ms ---

export const landingToBuilder: MotionVariantSet = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export const landingToBuilderReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  exit: opacityOnly(0),
  transition: INSTANT,
}

// --- Preview Pulse: border pulse on update, 200ms ---

export const previewPulse: MotionVariantSet = {
  animate: {
    borderColor: [
      'var(--preview-frame, #E2DED6)',
      'var(--preview-updated-pulse, #A6E58B)',
      'var(--preview-frame, #E2DED6)',
    ],
  },
  transition: { duration: 0.2 },
}

export const previewPulseReduced: MotionVariantSet = {
  animate: opacityOnly(1),
  transition: INSTANT,
}

// --- Undo Crossfade: crossfade between states, 300ms ---

export const undoCrossfade: MotionVariantSet = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export const undoCrossfadeReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  exit: opacityOnly(0),
  transition: INSTANT,
}

// --- Publish Card: slide up + bounce, 400ms ---

export const publishCard: MotionVariantSet = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', duration: 0.4, bounce: 0.3 },
}

export const publishCardReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  transition: INSTANT,
}

// --- Chat Message: slide up + fade in, 150ms ---

export const chatMessage: MotionVariantSet = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15 },
}

export const chatMessageReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  transition: INSTANT,
}

// --- Error Dim: preview dims to 60% opacity, 200ms ---

export const errorDim: MotionVariantSet = {
  animate: { opacity: 0.6 },
  transition: { duration: 0.2 },
}

export const errorDimReduced: MotionVariantSet = {
  animate: opacityOnly(0.6),
  transition: INSTANT,
}

// --- Landing Exit: content slides up and fades out, 400ms easeIn ---

export const landingExit: MotionVariantSet = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.4, ease: 'easeIn' },
}

export const landingExitReduced: MotionVariantSet = {
  initial: opacityOnly(1),
  animate: opacityOnly(1),
  exit: opacityOnly(0),
  transition: INSTANT,
}

// --- Builder Enter Left: chat pane slides from left, 500ms easeOut ---

export const builderEnterLeft: MotionVariantSet = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export const builderEnterLeftReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  transition: INSTANT,
}

// --- Builder Enter Right: preview pane slides from right, 500ms easeOut ---

export const builderEnterRight: MotionVariantSet = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export const builderEnterRightReduced: MotionVariantSet = {
  initial: opacityOnly(0),
  animate: opacityOnly(1),
  transition: INSTANT,
}

// --- Variant names for programmatic access ---

const variants = {
  authModal: { standard: authModal, reduced: authModalReduced },
  builderEnterLeft: { standard: builderEnterLeft, reduced: builderEnterLeftReduced },
  builderEnterRight: { standard: builderEnterRight, reduced: builderEnterRightReduced },
  chatMessage: { standard: chatMessage, reduced: chatMessageReduced },
  errorDim: { standard: errorDim, reduced: errorDimReduced },
  landingExit: { standard: landingExit, reduced: landingExitReduced },
  landingToBuilder: { standard: landingToBuilder, reduced: landingToBuilderReduced },
  previewPulse: { standard: previewPulse, reduced: previewPulseReduced },
  publishCard: { standard: publishCard, reduced: publishCardReduced },
  undoCrossfade: { standard: undoCrossfade, reduced: undoCrossfadeReduced },
} as const

export type VariantName = keyof typeof variants

export function getVariant(name: VariantName, prefersReducedMotion: boolean): MotionVariantSet {
  const pair = variants[name]
  return prefersReducedMotion ? pair.reduced : pair.standard
}
