import type { SearchFormState } from '@/engine'
import { SearchBar } from '../booking/SearchBar'

interface HeroProps {
  title?: string
  subtitle?: string
  searchState: SearchFormState
  onSearchChange: (state: SearchFormState) => void
  onSearch: () => void
}

export function Hero({
  title = 'Find your perfect stay',
  subtitle = 'Discover handpicked vacation rentals with verified availability and instant booking.',
  searchState,
  onSearchChange,
  onSearch,
}: HeroProps) {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
        <SearchBar value={searchState} onChange={onSearchChange} onSearch={onSearch} />
      </div>
    </section>
  )
}
