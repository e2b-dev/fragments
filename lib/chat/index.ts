export const CHAT_SUBSYSTEM = 'chat' as const

// TODO: Story 1.11 — Chat UI and streaming responses

export type {} from './types'

export {
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

export type { MotionVariantSet, VariantName } from './transitions'
