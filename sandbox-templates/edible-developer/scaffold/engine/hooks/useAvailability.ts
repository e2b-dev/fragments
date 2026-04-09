import { useQuery } from '@tanstack/react-query'
import { useEngine } from '../provider'
import { toDisplayPricing, type DisplayPricing } from '../transforms/reservation'

interface UseAvailabilityParams {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
}

export interface AvailabilityData {
  available: boolean
  pricing?: DisplayPricing
  minStay?: number
  maxStay?: number
}

export function useAvailability(params: UseAvailabilityParams) {
  const engine = useEngine()
  const enabled = !!(params.listingId && params.checkIn && params.checkOut && params.guests)

  return useQuery({
    queryKey: ['availability', params],
    queryFn: async (): Promise<AvailabilityData> => {
      const result = await engine.availability.check(params)
      return {
        available: result.available,
        pricing: result.pricing ? toDisplayPricing(result.pricing) : undefined,
        minStay: result.minStay,
        maxStay: result.maxStay,
      }
    },
    enabled,
  })
}
