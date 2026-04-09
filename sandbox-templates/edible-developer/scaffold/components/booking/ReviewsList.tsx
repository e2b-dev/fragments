import type { DisplayReview } from '@/engine'

interface ReviewsListProps {
  reviews: DisplayReview[]
  total: number
  averageRating?: number
}

export function ReviewsList({ reviews, total, averageRating }: ReviewsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {averageRating !== undefined && averageRating > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <span>&#9733;</span>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({total} reviews)</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {review.authorName.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{review.authorName}</span>
                </div>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-muted'}>
                    &#9733;
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
