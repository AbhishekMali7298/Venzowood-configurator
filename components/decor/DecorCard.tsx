import type { Decor } from '@/features/decor/types'

interface DecorCardProps {
  decor: Decor
  active: boolean
  onSelect: (decor: Decor) => void
}

export function DecorCard({ decor, active, onSelect }: DecorCardProps) {
  return (
    <button
      className={`rounded-lg border p-3 text-left transition ${
        active ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-500'
      }`}
      onClick={() => onSelect(decor)}
      type="button"
      data-testid={`decor-card-${decor.code}`}
    >
      <p className="text-sm font-medium text-stone-900">{decor.name}</p>
      <p className="mt-1 text-xs text-stone-600">{decor.code}</p>
    </button>
  )
}
