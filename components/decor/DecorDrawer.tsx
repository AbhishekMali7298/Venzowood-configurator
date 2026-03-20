'use client'

import { useMemo, useState } from 'react'

import type { Decor } from '@/features/decor/types'

import { CategoryFilter } from './CategoryFilter'
import { DecorCard } from './DecorCard'
import { DecorSearch } from './DecorSearch'

interface DecorDrawerProps {
  sectionId: string
  decors: Decor[]
  activeDecorCode?: string
  onSelect: (sectionId: string, decor: Decor) => void
  onClose: () => void
}

export function DecorDrawer({
  sectionId,
  decors,
  activeDecorCode,
  onSelect,
  onClose,
}: DecorDrawerProps) {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const categories = useMemo(() => {
    const set = new Set(decors.map((decor) => decor.category))
    return ['all', ...Array.from(set)]
  }, [decors])

  const filtered = useMemo(
    () =>
      decors.filter((decor) => {
        const categoryMatch = category === 'all' || decor.category === category
        const searchMatch =
          search.length === 0 || decor.name.toLowerCase().includes(search.toLowerCase())
        return categoryMatch && searchMatch
      }),
    [category, decors, search],
  )

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-stone-300 bg-white p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Choose decor</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="space-y-3">
        <DecorSearch value={search} onChange={setSearch} />
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 overflow-auto pb-6" data-testid="decor-drawer">
        {filtered.map((decor) => (
          <DecorCard
            key={decor.code}
            decor={decor}
            active={decor.code === activeDecorCode}
            onSelect={(selected) => onSelect(sectionId, selected)}
          />
        ))}
      </div>
    </aside>
  )
}
