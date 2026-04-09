import { useMutation } from '@tanstack/react-query'
import { useEngine } from '../provider'
import {
  toReservationRequest,
  toDisplayReservation,
  type ReservationFormState,
  type DisplayReservation,
} from '../transforms/reservation'

export function useCreateReservation() {
  const engine = useEngine()

  return useMutation({
    mutationFn: async (form: ReservationFormState): Promise<DisplayReservation> => {
      const request = toReservationRequest(form)
      const reservation = await engine.reservations.create(request)
      return toDisplayReservation(reservation)
    },
  })
}
