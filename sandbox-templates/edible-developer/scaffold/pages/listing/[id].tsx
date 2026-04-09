import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useListing, useAvailability, useReviews, siteConfig } from '@/engine'
import { PageShell } from '@/components/layout/PageShell'
import { GalleryViewer } from '@/components/booking/GalleryViewer'
import { PricingBreakdown } from '@/components/booking/PricingBreakdown'
import { ReviewsList } from '@/components/booking/ReviewsList'

export default function ListingPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: listing, isLoading } = useListing(id as string)
  const { data: reviews } = useReviews(id as string)

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  const { data: availability } = useAvailability({
    listingId: (id as string) ?? '',
    checkIn,
    checkOut,
    guests,
  })

  if (isLoading) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[16/9] bg-muted rounded-xl" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
      </PageShell>
    )
  }

  if (!listing) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Listing not found</h1>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Head>
        <title>{listing.title} | {siteConfig.branding.name}</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div className="space-y-8">
            <GalleryViewer images={listing.galleryImages} />

            <div>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <p className="text-muted-foreground mt-1">{listing.subtitle}</p>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span>{listing.beds}</span>
                <span className="text-muted-foreground">&middot;</span>
                <span>Up to {listing.maxGuests} guests</span>
                {listing.rating > 0 && (
                  <>
                    <span className="text-muted-foreground">&middot;</span>
                    <span>&#9733; {listing.rating.toFixed(1)} ({listing.reviewCount})</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">About this property</h2>
              <p className="text-muted-foreground">{listing.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {listing.allAmenities.map((amenity) => (
                  <span key={amenity.id} className="text-sm text-muted-foreground">
                    {amenity.label}
                  </span>
                ))}
              </div>
            </div>

            {reviews && (
              <ReviewsList
                reviews={reviews.reviews}
                total={reviews.total}
                averageRating={listing.rating}
              />
            )}
          </div>

          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="border border-border rounded-xl p-6 space-y-4">
              <div className="text-2xl font-bold">{listing.pricePerNight}<span className="text-base font-normal text-muted-foreground">/night</span></div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  >
                    {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {availability?.pricing && <PricingBreakdown pricing={availability.pricing} />}

              <button
                onClick={() =>
                  router.push({
                    pathname: '/checkout',
                    query: { listingId: listing.id, checkIn, checkOut, guests },
                  })
                }
                disabled={!availability?.available}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availability?.available ? 'Reserve' : 'Select dates'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
