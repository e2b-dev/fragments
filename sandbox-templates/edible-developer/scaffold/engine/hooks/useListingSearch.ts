import { useQuery } from '@tanstack/react-query'
import { useEngine } from '../provider'
import { toSearchParams, toDisplaySearchResult, type SearchFormState } from '../transforms/search'

export function useListingSearch(formState: SearchFormState) {
  const engine = useEngine()

  return useQuery({
    queryKey: ['listings', 'search', formState],
    queryFn: async () => {
      const params = toSearchParams(formState)
      const result = await engine.listings.search(params)
      return toDisplaySearchResult(result)
    },
    enabled: formState.isReady,
  })
}
