import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { defaultSearchFormState, useListingSearch, siteConfig } from '@/engine'
import type { SearchFormState } from '@/engine'
import { PageShell } from '@/components/layout/PageShell'
import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { ListingGrid } from '@/components/booking/ListingGrid'

export default function HomePage() {
  const router = useRouter()
  const [searchState, setSearchState] = useState<SearchFormState>(defaultSearchFormState)
  const { data, isLoading } = useListingSearch(searchState)

  const handleSearch = () => {
    router.push({
      pathname: '/search',
      query: {
        location: searchState.location || undefined,
        checkIn: searchState.checkIn || undefined,
        checkOut: searchState.checkOut || undefined,
        guests: searchState.guests,
      },
    })
  }

  return (
    <PageShell>
      <Head>
        <title>{siteConfig.branding.name}</title>
      </Head>
      <Hero searchState={searchState} onSearchChange={setSearchState} onSearch={handleSearch} />
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Featured listings</h2>
        <ListingGrid
          listings={data?.listings ?? []}
          isLoading={isLoading}
          onSelect={(id) => router.push(`/listing/${id}`)}
        />
      </section>
      <Features />
    </PageShell>
  )
}
