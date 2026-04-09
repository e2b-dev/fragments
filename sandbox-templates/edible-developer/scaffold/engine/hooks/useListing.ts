import { useQuery } from '@tanstack/react-query'
import { useEngine } from '../provider'
import { toDisplayListing } from '../transforms/listing'

export function useListing(id: string | undefined) {
  const engine = useEngine()

  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      if (!id) return null
      const listing = await engine.listings.getById(id)
      return listing ? toDisplayListing(listing) : null
    },
    enabled: !!id,
  })
}
