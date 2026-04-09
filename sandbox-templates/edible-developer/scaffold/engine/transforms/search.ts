import type { SearchParams, SearchResult } from '../sdk'
import { toDisplayListing, type DisplayListing } from './listing'

/**
 * SearchFormState is what the UI form controls produce.
 * toSearchParams() converts it to the SDK's SearchParams.
 */
export interface SearchFormState {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  minPrice?: number
  maxPrice?: number
  propertyTypes: string[]
  amenities: string[]
  petFriendly: boolean
  page: number
  isReady: boolean
}

export const defaultSearchFormState: SearchFormState = {
  location: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  propertyTypes: [],
  amenities: [],
  petFriendly: false,
  page: 1,
  isReady: true,
}

export interface DisplaySearchResult {
  listings: DisplayListing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets: SearchResult['facets']
}

export function toSearchParams(formState: SearchFormState): SearchParams {
  return {
    location: formState.location || undefined,
    checkIn: formState.checkIn || undefined,
    checkOut: formState.checkOut || undefined,
    guests: formState.guests,
    minPrice: formState.minPrice,
    maxPrice: formState.maxPrice,
    propertyType: formState.propertyTypes.length > 0 ? (formState.propertyTypes as any) : undefined,
    amenities: formState.amenities.length > 0 ? formState.amenities : undefined,
    petFriendly: formState.petFriendly || undefined,
    page: formState.page,
  }
}

export function toDisplaySearchResult(result: SearchResult): DisplaySearchResult {
  return {
    listings: result.listings.map(toDisplayListing),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: Math.ceil(result.total / result.pageSize),
    facets: result.facets,
  }
}
