import type { SearchFormState } from '@/engine'

interface SearchBarProps {
  value: SearchFormState
  onChange: (state: SearchFormState) => void
  onSearch?: () => void
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border rounded-xl shadow-sm">
      <input
        type="text"
        placeholder="Where are you going?"
        value={value.location}
        onChange={(e) => onChange({ ...value, location: e.target.value })}
        className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="date"
        value={value.checkIn}
        onChange={(e) => onChange({ ...value, checkIn: e.target.value })}
        className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="date"
        value={value.checkOut}
        onChange={(e) => onChange({ ...value, checkOut: e.target.value })}
        className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        value={value.guests}
        onChange={(e) => onChange({ ...value, guests: parseInt(e.target.value) })}
        className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} guest{n > 1 ? 's' : ''}
          </option>
        ))}
      </select>
      <button
        onClick={onSearch}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Search
      </button>
    </div>
  )
}
