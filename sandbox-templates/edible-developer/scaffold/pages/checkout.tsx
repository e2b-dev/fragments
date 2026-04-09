import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import {
  useListing,
  useAvailability,
  useCreateReservation,
  defaultReservationFormState,
  siteConfig,
} from '@/engine'
import type { ReservationFormState } from '@/engine'
import { PageShell } from '@/components/layout/PageShell'
import { PricingBreakdown } from '@/components/booking/PricingBreakdown'

export default function CheckoutPage() {
  const router = useRouter()
  const { listingId, checkIn, checkOut, guests } = router.query

  const { data: listing } = useListing(listingId as string)
  const { data: availability } = useAvailability({
    listingId: (listingId as string) ?? '',
    checkIn: (checkIn as string) ?? '',
    checkOut: (checkOut as string) ?? '',
    guests: guests ? parseInt(guests as string) : 1,
  })

  const createReservation = useCreateReservation()

  const [form, setForm] = useState<ReservationFormState>(defaultReservationFormState)

  useEffect(() => {
    if (!router.isReady) return
    setForm((prev) => ({
      ...prev,
      listingId: (listingId as string) ?? '',
      checkIn: (checkIn as string) ?? '',
      checkOut: (checkOut as string) ?? '',
      guests: guests ? parseInt(guests as string) : 1,
    }))
  }, [router.isReady, listingId, checkIn, checkOut, guests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const reservation = await createReservation.mutateAsync(form)
    router.push({ pathname: '/confirmation', query: { id: reservation.id } })
  }

  const updateField = (field: keyof ReservationFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <PageShell>
      <Head>
        <title>Checkout | {siteConfig.branding.name}</title>
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-8">Complete your reservation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Guest information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">First name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>
              <div className="mt-4">
                <label className="text-sm text-muted-foreground">Phone</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Special requests (optional)</label>
              <textarea
                value={form.specialRequests}
                onChange={(e) => updateField('specialRequests', e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={createReservation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createReservation.isPending ? 'Processing...' : 'Confirm reservation'}
            </button>
          </form>

          <aside className="h-fit border border-border rounded-xl p-6 space-y-4">
            {listing && (
              <div className="flex gap-4">
                <img
                  src={listing.heroImage}
                  alt={listing.title}
                  className="w-20 h-14 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-medium text-sm">{listing.title}</h3>
                  <p className="text-xs text-muted-foreground">{listing.subtitle}</p>
                </div>
              </div>
            )}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span>{checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span>{guests}</span>
              </div>
            </div>
            {availability?.pricing && <PricingBreakdown pricing={availability.pricing} />}
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
