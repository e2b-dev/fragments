import { useQuery } from '@tanstack/react-query'
import { useEngine } from '../provider'
import type { Review } from '../sdk'

export interface DisplayReview {
  id: string
  authorName: string
  authorAvatar?: string
  rating: number
  comment: string
  date: string
  response?: string
}

function toDisplayReview(review: Review): DisplayReview {
  return {
    id: review.id,
    authorName: review.authorName,
    authorAvatar: review.authorAvatar,
    rating: review.rating,
    comment: review.comment,
    date: new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(review.date)),
    response: review.response,
  }
}

export function useReviews(listingId: string | undefined) {
  const engine = useEngine()

  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      if (!listingId) return { reviews: [], total: 0 }
      const result = await engine.reviews.getForListing(listingId)
      return {
        reviews: result.reviews.map(toDisplayReview),
        total: result.total,
      }
    },
    enabled: !!listingId,
  })
}
