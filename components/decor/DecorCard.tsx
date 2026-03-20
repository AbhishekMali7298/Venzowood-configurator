import Image from 'next/image'
import { useState } from 'react'

import type { Decor } from '@/features/decor/types'

interface DecorCardProps {
  decor: Decor
  active: boolean
  onSelect: (decor: Decor) => void
  onHover?: (decor: Decor) => void
  variant?: 'compact' | 'panel'
}

export function DecorCard({ decor, active, onSelect, onHover, variant = 'compact' }: DecorCardProps) {
  const [isFavourite, setIsFavourite] = useState(false)
  const panel = variant === 'panel'

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavourite((prev) => !prev)
  }

  return (
    <button
      className={`relative text-left transition ${
        panel
          ? `w-full overflow-hidden border border-stone-200 bg-white ${
              active ? 'border-transparent shadow-[0_0_0_2px_#333]' : 'hover:border-stone-400'
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
        className={`relative overflow-hidden border border-stone-200 bg-stone-100 ${
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

        {/* Top-left "Applied" badge */}
        {active && panel ? (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-stone-900 shadow-sm backdrop-blur-sm">
            <span className="text-stone-500">⊙</span> Applied
          </div>
        ) : null}

        {/* Top-right "New" badge (mocked logic) */}
        {!active && panel && decor.code.startsWith('W') ? (
          <div className="absolute left-3 top-3 bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
            New
          </div>
        ) : null}

        {/* Top-right Favourites button */}
        {panel ? (
          <button
            type="button"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm transition hover:scale-110"
            onClick={handleFavourite}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {isFavourite ? '♥' : '♡'}
          </button>
        ) : null}
      </div>

      {panel ? (
        <div className="px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-stone-900">{decor.name}</p>
              <p className="text-xs text-stone-500">{decor.code}</p>
            </div>
            <span className="text-xs font-medium text-rose-600 transition hover:text-rose-800">
              Details »
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-stone-900">{decor.name}</p>
          <p className="mt-1 text-xs text-stone-600">{decor.code}</p>
        </>
      )}
    </button>
  )
}

