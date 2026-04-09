import type { ReservationRequest, Reservation, AvailabilityResult } from '../sdk'

/**
 * ReservationFormState is what the checkout form produces.
 * DisplayPricing and DisplayReservation are what the UI renders.
 */
export interface ReservationFormState {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests: string
}

export const defaultReservationFormState: ReservationFormState = {
  listingId: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialRequests: '',
}

export interface DisplayPricing {
  nightly: string
  nights: number
  subtotal: string
  cleaningFee: string
  serviceFee: string
  total: string
  currency: string
}

export interface DisplayReservation {
  id: string
  status: string
  listingTitle: string
  checkIn: string
  checkOut: string
  guests: number
  pricing?: DisplayPricing
  guestName: string
  guestEmail: string
  createdAt: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function toReservationRequest(form: ReservationFormState): ReservationRequest {
  return {
    listingId: form.listingId,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    guests: form.guests,
    guestInfo: {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
    },
    specialRequests: form.specialRequests || undefined,
  }
}

export function toDisplayPricing(pricing: NonNullable<AvailabilityResult['pricing']>): DisplayPricing {
  return {
    nightly: formatCurrency(pricing.nightly, pricing.currency),
    nights: pricing.nights,
    subtotal: formatCurrency(pricing.subtotal, pricing.currency),
    cleaningFee: formatCurrency(pricing.cleaningFee, pricing.currency),
    serviceFee: formatCurrency(pricing.serviceFee, pricing.currency),
    total: formatCurrency(pricing.total, pricing.currency),
    currency: pricing.currency,
  }
}

export function toDisplayReservation(reservation: Reservation): DisplayReservation {
  return {
    id: reservation.id,
    status: reservation.status,
    listingTitle: reservation.listing.title,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guests: reservation.guests,
    pricing: reservation.pricing ? toDisplayPricing(reservation.pricing) : undefined,
    guestName: `${reservation.guestInfo.firstName} ${reservation.guestInfo.lastName}`,
    guestEmail: reservation.guestInfo.email,
    createdAt: reservation.createdAt,
  }
}
