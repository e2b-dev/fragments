import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { defaultSearchFormState, useListingSearch, siteConfig } from '@/engine'
import type { SearchFormState } from '@/engine'
import { PageShell } from '@/components/layout/PageShell'
import { SearchBar } from '@/components/booking/SearchBar'
import { SearchFilters } from '@/components/booking/SearchFilters'
import { ListingGrid } from '@/components/booking/ListingGrid'

export default function SearchPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<SearchFormState>({
    ...defaultSearchFormState,
    isReady: false,
  })

  // Hydrate form state from URL query params
  useEffect(() => {
    if (!router.isReady) return
    setFormState({
      ...defaultSearchFormState,
      location: (router.query.location as string) ?? '',
      checkIn: (router.query.checkIn as string) ?? '',
      checkOut: (router.query.checkOut as string) ?? '',
      guests: router.query.guests ? parseInt(router.query.guests as string) : 1,
      isReady: true,
    })
  }, [router.isReady, router.query])

  const { data, isLoading } = useListingSearch(formState)

  return (
    <PageShell>
      <Head>
        <title>Search | {siteConfig.branding.name}</title>
      </Head>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <SearchBar value={formState} onChange={setFormState} />
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <SearchFilters value={formState} onChange={setFormState} />
          <div>
            {data && (
              <p className="text-sm text-muted-foreground mb-4">
                {data.total} listing{data.total !== 1 ? 's' : ''} found
              </p>
            )}
            <ListingGrid
              listings={data?.listings ?? []}
              isLoading={isLoading}
              onSelect={(id) => router.push(`/listing/${id}`)}
            />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
