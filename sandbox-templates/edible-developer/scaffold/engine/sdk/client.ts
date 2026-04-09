/**
 * @edible/sdk client stub
 *
 * Mock implementation that returns placeholder data.
 * Replace with the real SDK client when published.
 */

import type {
  SearchParams,
  SearchResult,
  Listing,
  AvailabilityParams,
  AvailabilityResult,
  ReservationRequest,
  Reservation,
  Review,
} from './types'
import { mockListings, mockReviews } from './mock-data'

export interface EngineClientConfig {
  provider: string
  apiBase: string
  apiKey?: string
}

export class EngineClient {
  constructor(private config: EngineClientConfig) {}

  listings = {
    search: async (params: SearchParams): Promise<SearchResult> => {
      // Stub: filter mock data
      let results = [...mockListings]

      if (params.location) {
        const q = params.location.toLowerCase()
        results = results.filter(
          (l) =>
            l.location.city.toLowerCase().includes(q) ||
            l.location.region.toLowerCase().includes(q) ||
            l.location.country.toLowerCase().includes(q),
        )
      }

      if (params.guests) {
        results = results.filter((l) => l.maxGuests >= params.guests!)
      }

      if (params.minPrice) {
        results = results.filter(
          (l) => l.pricing.basePrice >= params.minPrice!,
        )
      }

      if (params.maxPrice) {
        results = results.filter(
          (l) => l.pricing.basePrice <= params.maxPrice!,
        )
      }

      const page = params.page ?? 1
      const pageSize = params.pageSize ?? 12
      const start = (page - 1) * pageSize

      return {
        listings: results.slice(start, start + pageSize),
        total: results.length,
        page,
        pageSize,
        facets: {
          propertyTypes: [
            { value: 'villa', count: 4 },
            { value: 'apartment', count: 3 },
            { value: 'house', count: 2 },
          ],
          priceRange: { min: 80, max: 500 },
          amenities: [
            { value: 'wifi', count: 8 },
            { value: 'pool', count: 5 },
            { value: 'parking', count: 6 },
          ],
        },
      }
    },

    getById: async (id: string): Promise<Listing | null> => {
      return mockListings.find((l) => l.id === id) ?? null
    },
  }

  availability = {
    check: async (params: AvailabilityParams): Promise<AvailabilityResult> => {
      const listing = mockListings.find((l) => l.id === params.listingId)
      if (!listing) return { available: false }

      const checkIn = new Date(params.checkIn)
      const checkOut = new Date(params.checkOut)
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      )

      const subtotal = listing.pricing.basePrice * nights
      const cleaningFee = listing.pricing.cleaningFee ?? 50
      const serviceFee = Math.round(subtotal * 0.12)

      return {
        available: true,
        pricing: {
          nightly: listing.pricing.basePrice,
          nights,
          subtotal,
          cleaningFee,
          serviceFee,
          total: subtotal + cleaningFee + serviceFee,
          currency: listing.pricing.currency,
        },
        minStay: 2,
        maxStay: 30,
      }
    },
  }

  reservations = {
    create: async (request: ReservationRequest): Promise<Reservation> => {
      const listing = mockListings.find((l) => l.id === request.listingId)!
      const availability = await this.availability.check({
        listingId: request.listingId,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        guests: request.guests,
      })

      return {
        id: `res_${Date.now()}`,
        status: 'confirmed',
        listing,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        guests: request.guests,
        pricing: availability.pricing,
        guestInfo: request.guestInfo,
        createdAt: new Date().toISOString(),
      }
    },

    getById: async (id: string): Promise<Reservation | null> => {
      return null // stub
    },
  }

  reviews = {
    getForListing: async (
      listingId: string,
    ): Promise<{ reviews: Review[]; total: number }> => {
      return {
        reviews: mockReviews,
        total: mockReviews.length,
      }
    },
  }
}
