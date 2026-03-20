interface CategoryFilterProps {
  categories: string[]
  value: string
  onChange: (value: string) => void
}

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            value === category
              ? 'bg-stone-900 text-white'
              : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
