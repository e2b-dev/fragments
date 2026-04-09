import type { DisplayListing } from '@/engine'

interface ListingCardProps {
  listing: DisplayListing
  onSelect: (id: string) => void
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
      onClick={() => onSelect(listing.id)}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={listing.heroImage}
          alt={listing.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
        />
        <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 text-sm font-medium">
          {listing.pricePerNight}/night
        </div>
        {listing.petFriendly && (
          <div className="absolute top-3 left-3 bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs font-medium">
            Pet friendly
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
          {listing.rating > 0 && (
            <div className="flex items-center gap-1 text-sm shrink-0 ml-2">
              <span>&#9733;</span>
              <span>{listing.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({listing.reviewCount})</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{listing.subtitle}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{listing.beds}</span>
          <span>&middot;</span>
          <span>Up to {listing.maxGuests} guests</span>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {listing.highlights.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
