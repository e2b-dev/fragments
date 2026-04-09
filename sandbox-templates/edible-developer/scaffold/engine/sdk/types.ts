/**
 * @edible/sdk type stubs
 *
 * These types define the API contract between the booking engine and the frontend.
 * When the real SDK is published, swap this import path for '@edible/sdk'.
 */

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'cabin'
  | 'cottage'
  | 'condo'
  | 'townhouse'
  | 'other'

export interface ListingLocation {
  city: string
  region: string
  country: string
  coordinates: { lat: number; lng: number }
  address?: string
}

export interface ListingImage {
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface Amenity {
  id: string
  label: string
  category: string
  icon?: string
}

export interface PricingInfo {
  basePrice: number
  currency: string
  cleaningFee?: number
  serviceFee?: number
  weeklyDiscount?: number
  monthlyDiscount?: number
}

export interface AvailabilityWindow {
  startDate: string
  endDate: string
  available: boolean
  minStay?: number
  price?: number
}

export interface PetPolicy {
  allowed: boolean
  description?: string
  fee?: number
}

export interface ReviewSummary {
  averageRating: number
  totalCount: number
}

export interface Review {
  id: string
  authorName: string
  authorAvatar?: string
  rating: number
  comment: string
  date: string
  response?: string
}

export interface Listing {
  id: string
  title: string
  description: string
  location: ListingLocation
  images: ListingImage[]
  amenities: Amenity[]
  pricing: PricingInfo
  availability: AvailabilityWindow[]
  reviews?: ReviewSummary
  maxGuests: number
  bedrooms: number
  bathrooms: number
  propertyType: PropertyType
  petPolicy?: PetPolicy
}

export interface SearchParams {
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  propertyType?: PropertyType[]
  petFriendly?: boolean
  page?: number
  pageSize?: number
}

export interface SearchFacets {
  propertyTypes: { value: string; count: number }[]
  priceRange: { min: number; max: number }
  amenities: { value: string; count: number }[]
}

export interface SearchResult {
  listings: Listing[]
  total: number
  page: number
  pageSize: number
  facets: SearchFacets
}

export interface AvailabilityParams {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
}

export interface AvailabilityResult {
  available: boolean
  pricing?: {
    nightly: number
    nights: number
    subtotal: number
    cleaningFee: number
    serviceFee: number
    total: number
    currency: string
  }
  minStay?: number
  maxStay?: number
}

export interface ReservationRequest {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
  guestInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  specialRequests?: string
}

export interface Reservation {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  listing: Listing
  checkIn: string
  checkOut: string
  guests: number
  pricing: AvailabilityResult['pricing']
  guestInfo: ReservationRequest['guestInfo']
  createdAt: string
}
