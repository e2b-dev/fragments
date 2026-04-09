// Engine barrel export — presentation layer imports from here

// Provider
export { EngineProvider, useEngine } from './provider'

// Hooks
export { useListingSearch } from './hooks/useListingSearch'
export { useListing } from './hooks/useListing'
export { useAvailability } from './hooks/useAvailability'
export { useCreateReservation } from './hooks/useReservation'
export { useReviews } from './hooks/useReviews'

// Display types (what presentation components consume)
export type { DisplayListing } from './transforms/listing'
export type { SearchFormState, DisplaySearchResult } from './transforms/search'
export { defaultSearchFormState } from './transforms/search'
export type {
  ReservationFormState,
  DisplayPricing,
  DisplayReservation,
} from './transforms/reservation'
export { defaultReservationFormState } from './transforms/reservation'
export type { DisplayReview } from './hooks/useReviews'
export type { AvailabilityData } from './hooks/useAvailability'

// Config
export { siteConfig } from './config'
