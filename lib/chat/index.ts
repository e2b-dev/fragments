export const CHAT_SUBSYSTEM = 'chat' as const

// TODO: Story 1.11 — Chat UI and streaming responses

export type {} from './types'

export {
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

export type { MotionVariantSet, VariantName } from './transitions'
