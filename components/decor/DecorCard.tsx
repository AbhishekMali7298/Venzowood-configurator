import Image from 'next/image'

import type { Decor } from '@/features/decor/types'

interface DecorCardProps {
  decor: Decor
  active: boolean
  onSelect: (decor: Decor) => void
  onHover?: (decor: Decor) => void
  variant?: 'compact' | 'panel'
}

export function DecorCard({ decor, active, onSelect, onHover, variant = 'compact' }: DecorCardProps) {
  const availableInIndia = decor.availability.IN ?? true
  const panel = variant === 'panel'

  return (
    <button
      className={`text-left transition ${
        panel
          ? `w-full overflow-hidden border border-stone-300 bg-white ${
              active ? 'border-stone-900 shadow-[inset_0_0_0_1px_#111]' : 'hover:border-stone-500'
            }`
          : `rounded-lg border p-3 ${
              active ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:border-stone-500'
            }`
      }`}
      onClick={() => onSelect(decor)}
      onMouseEnter={() => onHover?.(decor)}
      onFocus={() => onHover?.(decor)}
      type="button"
      data-testid={`decor-card-${decor.code}`}
    >
      <div
        className={`overflow-hidden border border-stone-200 bg-stone-100 ${
          panel ? 'aspect-[4/3] border-x-0 border-t-0' : 'mb-2 rounded-md'
        }`}
      >
        <Image
          src={decor.thumb}
          alt={decor.name}
          className={`w-full object-cover ${panel ? 'h-full' : 'h-14'}`}
          width={panel ? 640 : 112}
          height={panel ? 480 : 56}
          loading="lazy"
        />
      </div>

      {panel ? (
        <div className="px-3 py-2">
          <p className="text-base font-medium text-stone-900">{decor.name}</p>
          <p className="mt-1 text-sm text-stone-600">{decor.code}</p>
          <p className="mt-1 text-xs text-stone-500">
            {availableInIndia ? 'Available in IN' : 'Unavailable in IN'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-stone-900">{decor.name}</p>
          <p className="mt-1 text-xs text-stone-600">{decor.code}</p>
          <p className="mt-1 text-xs text-stone-500">
            {availableInIndia ? 'Available in IN' : 'Unavailable in IN'}
          </p>
        </>
      )}
    </button>
  )
}
