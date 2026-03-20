import Image from 'next/image'

import type { Decor } from '@/features/decor/types'

interface DecorCardProps {
  decor: Decor
  active: boolean
  onSelect: (decor: Decor) => void
  onHover?: (decor: Decor) => void
}

export function DecorCard({ decor, active, onSelect, onHover }: DecorCardProps) {
  const availableInIndia = decor.availability.IN ?? true

  return (
    <button
      className={`rounded-lg border p-3 text-left transition ${
        active ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-500'
      }`}
      onClick={() => onSelect(decor)}
      onMouseEnter={() => onHover?.(decor)}
      onFocus={() => onHover?.(decor)}
      type="button"
      data-testid={`decor-card-${decor.code}`}
    >
      <div className="mb-2 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
        <Image
          src={decor.thumb}
          alt={decor.name}
          className="h-14 w-full object-cover"
          width={112}
          height={56}
          loading="lazy"
        />
      </div>
      <p className="text-sm font-medium text-stone-900">{decor.name}</p>
      <p className="mt-1 text-xs text-stone-600">{decor.code}</p>
      <p className="mt-1 text-xs text-stone-500">
        {availableInIndia ? 'Available in IN' : 'Unavailable in IN'}
      </p>
    </button>
  )
}
