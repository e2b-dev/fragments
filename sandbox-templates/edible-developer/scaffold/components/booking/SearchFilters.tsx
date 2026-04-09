import type { SearchFormState } from '@/engine'

interface SearchFiltersProps {
  value: SearchFormState
  onChange: (state: SearchFormState) => void
}

const propertyTypes = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'condo', label: 'Condo' },
]

export function SearchFilters({ value, onChange }: SearchFiltersProps) {
  const togglePropertyType = (type: string) => {
    const types = value.propertyTypes.includes(type)
      ? value.propertyTypes.filter((t) => t !== type)
      : [...value.propertyTypes, type]
    onChange({ ...value, propertyTypes: types })
  }

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="font-medium text-sm mb-3">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={value.minPrice ?? ''}
            onChange={(e) =>
              onChange({ ...value, minPrice: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={value.maxPrice ?? ''}
            onChange={(e) =>
              onChange({ ...value, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3">Property Type</h3>
        <div className="space-y-2">
          {propertyTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={value.propertyTypes.includes(type.value)}
                onChange={() => togglePropertyType(type.value)}
                className="rounded border-input"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={value.petFriendly}
            onChange={(e) => onChange({ ...value, petFriendly: e.target.checked })}
            className="rounded border-input"
          />
          Pet friendly
        </label>
      </div>
    </aside>
  )
}
