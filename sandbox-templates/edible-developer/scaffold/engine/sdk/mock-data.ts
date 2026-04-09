import type { Listing, Review } from './types'

export const mockListings: Listing[] = [
  {
    id: 'lst_001',
    title: 'Seaside Villa with Infinity Pool',
    description:
      'Stunning oceanfront villa featuring an infinity pool, private beach access, and panoramic sea views from every room.',
    location: {
      city: 'Dubrovnik',
      region: 'Dalmatia',
      country: 'Croatia',
      coordinates: { lat: 42.6507, lng: 18.0944 },
    },
    images: [
      { url: 'https://placehold.co/800x600/0ea5e9/white?text=Villa+Pool', alt: 'Villa with pool' },
      { url: 'https://placehold.co/800x600/0284c7/white?text=Sea+View', alt: 'Sea view' },
      { url: 'https://placehold.co/800x600/0369a1/white?text=Interior', alt: 'Interior' },
    ],
    amenities: [
      { id: 'pool', label: 'Infinity Pool', category: 'outdoor' },
      { id: 'wifi', label: 'High-speed WiFi', category: 'essentials' },
      { id: 'parking', label: 'Free Parking', category: 'essentials' },
      { id: 'ac', label: 'Air Conditioning', category: 'climate' },
      { id: 'kitchen', label: 'Full Kitchen', category: 'kitchen' },
      { id: 'beach', label: 'Beach Access', category: 'outdoor' },
    ],
    pricing: { basePrice: 350, currency: 'EUR', cleaningFee: 80, serviceFee: 42 },
    availability: [
      { startDate: '2026-04-01', endDate: '2026-10-31', available: true, minStay: 3 },
    ],
    reviews: { averageRating: 4.9, totalCount: 47 },
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    propertyType: 'villa',
  },
  {
    id: 'lst_002',
    title: 'Modern City Apartment',
    description:
      'Stylish apartment in the heart of the old town, walking distance to restaurants and landmarks.',
    location: {
      city: 'Split',
      region: 'Dalmatia',
      country: 'Croatia',
      coordinates: { lat: 43.5081, lng: 16.4402 },
    },
    images: [
      { url: 'https://placehold.co/800x600/8b5cf6/white?text=Apartment', alt: 'Apartment' },
      { url: 'https://placehold.co/800x600/7c3aed/white?text=Living+Room', alt: 'Living room' },
    ],
    amenities: [
      { id: 'wifi', label: 'High-speed WiFi', category: 'essentials' },
      { id: 'ac', label: 'Air Conditioning', category: 'climate' },
      { id: 'kitchen', label: 'Kitchenette', category: 'kitchen' },
      { id: 'washer', label: 'Washer', category: 'essentials' },
    ],
    pricing: { basePrice: 120, currency: 'EUR', cleaningFee: 30 },
    availability: [
      { startDate: '2026-04-01', endDate: '2026-12-31', available: true, minStay: 2 },
    ],
    reviews: { averageRating: 4.7, totalCount: 89 },
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'apartment',
  },
  {
    id: 'lst_003',
    title: 'Countryside Stone House',
    description:
      'Charming renovated stone house surrounded by olive groves with a private terrace and BBQ area.',
    location: {
      city: 'Hvar',
      region: 'Dalmatia',
      country: 'Croatia',
      coordinates: { lat: 43.1729, lng: 16.4411 },
    },
    images: [
      { url: 'https://placehold.co/800x600/f59e0b/white?text=Stone+House', alt: 'Stone house' },
      { url: 'https://placehold.co/800x600/d97706/white?text=Terrace', alt: 'Terrace' },
      { url: 'https://placehold.co/800x600/b45309/white?text=Garden', alt: 'Garden' },
    ],
    amenities: [
      { id: 'wifi', label: 'WiFi', category: 'essentials' },
      { id: 'parking', label: 'Private Parking', category: 'essentials' },
      { id: 'bbq', label: 'BBQ Area', category: 'outdoor' },
      { id: 'garden', label: 'Garden', category: 'outdoor' },
      { id: 'kitchen', label: 'Full Kitchen', category: 'kitchen' },
    ],
    pricing: { basePrice: 180, currency: 'EUR', cleaningFee: 45 },
    availability: [
      { startDate: '2026-05-01', endDate: '2026-09-30', available: true, minStay: 5 },
    ],
    reviews: { averageRating: 4.8, totalCount: 32 },
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'house',
    petPolicy: { allowed: true, description: 'Dogs welcome, max 2 pets', fee: 25 },
  },
  {
    id: 'lst_004',
    title: 'Luxury Penthouse with Rooftop',
    description:
      'Top-floor penthouse with a private rooftop terrace, jacuzzi, and 360-degree city views.',
    location: {
      city: 'Zagreb',
      region: 'Zagreb County',
      country: 'Croatia',
      coordinates: { lat: 45.815, lng: 15.9819 },
    },
    images: [
      { url: 'https://placehold.co/800x600/ec4899/white?text=Penthouse', alt: 'Penthouse' },
      { url: 'https://placehold.co/800x600/db2777/white?text=Rooftop', alt: 'Rooftop' },
    ],
    amenities: [
      { id: 'wifi', label: 'High-speed WiFi', category: 'essentials' },
      { id: 'jacuzzi', label: 'Jacuzzi', category: 'outdoor' },
      { id: 'ac', label: 'Air Conditioning', category: 'climate' },
      { id: 'kitchen', label: 'Full Kitchen', category: 'kitchen' },
      { id: 'gym', label: 'Gym Access', category: 'building' },
    ],
    pricing: { basePrice: 280, currency: 'EUR', cleaningFee: 60, serviceFee: 34 },
    availability: [
      { startDate: '2026-04-01', endDate: '2026-12-31', available: true, minStay: 2 },
    ],
    reviews: { averageRating: 4.6, totalCount: 21 },
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
  },
  {
    id: 'lst_005',
    title: 'Beachfront Cottage',
    description:
      'Cozy cottage steps from the beach with a sun deck, outdoor shower, and stunning sunset views.',
    location: {
      city: 'Zadar',
      region: 'Dalmatia',
      country: 'Croatia',
      coordinates: { lat: 44.1194, lng: 15.2314 },
    },
    images: [
      { url: 'https://placehold.co/800x600/10b981/white?text=Cottage', alt: 'Cottage' },
      { url: 'https://placehold.co/800x600/059669/white?text=Beach', alt: 'Beach' },
    ],
    amenities: [
      { id: 'wifi', label: 'WiFi', category: 'essentials' },
      { id: 'beach', label: 'Beach Access', category: 'outdoor' },
      { id: 'parking', label: 'Parking', category: 'essentials' },
      { id: 'kitchen', label: 'Kitchen', category: 'kitchen' },
    ],
    pricing: { basePrice: 95, currency: 'EUR', cleaningFee: 25 },
    availability: [
      { startDate: '2026-06-01', endDate: '2026-09-15', available: true, minStay: 3 },
    ],
    reviews: { averageRating: 4.5, totalCount: 58 },
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'cottage',
    petPolicy: { allowed: true, description: 'Small pets welcome', fee: 15 },
  },
]

export const mockReviews: Review[] = [
  {
    id: 'rev_001',
    authorName: 'Sarah M.',
    rating: 5,
    comment: 'Absolutely stunning property! The views were incredible and the host was very responsive.',
    date: '2026-03-15',
  },
  {
    id: 'rev_002',
    authorName: 'Marco R.',
    rating: 4,
    comment: 'Great location and very clean. The kitchen could use a few more utensils but overall excellent stay.',
    date: '2026-03-01',
  },
  {
    id: 'rev_003',
    authorName: 'Emma L.',
    rating: 5,
    comment: 'Perfect for our family vacation. Kids loved the pool and we loved the peaceful evenings on the terrace.',
    date: '2026-02-20',
  },
  {
    id: 'rev_004',
    authorName: 'James K.',
    rating: 4,
    comment: 'Beautiful property with amazing amenities. Would definitely come back!',
    date: '2026-02-10',
  },
]
