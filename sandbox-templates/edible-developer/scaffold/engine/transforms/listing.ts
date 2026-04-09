import type { Listing } from '../sdk'

/**
 * DisplayListing is the STABLE interface that presentation components code against.
 * When the SDK adds new fields, update toDisplayListing() to expose them here.
 * Presentation components never import SDK types directly.
 */
export interface DisplayListing {
  id: string
  title: string
  subtitle: string
  description: string
  heroImage: string
  galleryImages: { url: string; alt: string }[]
  pricePerNight: string
  rating: number
  reviewCount: number
  location: {
    city: string
    region: string
    country: string
    coordinates: { lat: number; lng: number }
  }
  highlights: string[]
  allAmenities: { id: string; label: string; category: string }[]
  beds: string
  maxGuests: number
  propertyType: string
  petFriendly?: boolean
  petPolicyText?: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function toDisplayListing(listing: Listing): DisplayListing {
  return {
    id: listing.id,
    title: listing.title,
    subtitle: `${listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)} in ${listing.location.city}`,
    description: listing.description,
    heroImage: listing.images[0]?.url ?? 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image',
    galleryImages: listing.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? listing.title,
    })),
    pricePerNight: formatCurrency(listing.pricing.basePrice, listing.pricing.currency),
    rating: listing.reviews?.averageRating ?? 0,
    reviewCount: listing.reviews?.totalCount ?? 0,
    location: {
      city: listing.location.city,
      region: listing.location.region,
      country: listing.location.country,
      coordinates: listing.location.coordinates,
    },
    highlights: listing.amenities.slice(0, 5).map((a) => a.label),
    allAmenities: listing.amenities.map((a) => ({
      id: a.id,
      label: a.label,
      category: a.category,
    })),
    beds: `${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? 's' : ''} \u00b7 ${listing.bathrooms} bathroom${listing.bathrooms !== 1 ? 's' : ''}`,
    maxGuests: listing.maxGuests,
    propertyType: listing.propertyType,
    petFriendly: listing.petPolicy?.allowed ?? undefined,
    petPolicyText: listing.petPolicy?.description ?? undefined,
  }
}
