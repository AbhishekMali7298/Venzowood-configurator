'use client'

import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { Decor } from '@/features/decor/types'

import { CategoryFilter } from './CategoryFilter'
import { DecorCard } from './DecorCard'
import { DecorSearch } from './DecorSearch'

const ITEMS_PER_ROW = 4
const ROW_HEIGHT = 132

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
  const parentRef = useRef<HTMLDivElement>(null)

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

  const totalRows = Math.ceil(filtered.length / ITEMS_PER_ROW)

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  })

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

      <div ref={parentRef} className="mt-4 h-[70vh] overflow-auto" data-testid="decor-drawer">
        {filtered.length === 0 ? (
          <p className="py-8 text-sm text-stone-600">No decors match your filter.</p>
        ) : (
          <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowStart = virtualRow.index * ITEMS_PER_ROW
              const rowItems = filtered.slice(rowStart, rowStart + ITEMS_PER_ROW)

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 top-0 grid w-full grid-cols-4 gap-2"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {rowItems.map((decor) => (
                    <DecorCard
                      key={decor.code}
                      decor={decor}
                      active={decor.code === activeDecorCode}
                      onSelect={(selected) => onSelect(sectionId, selected)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
