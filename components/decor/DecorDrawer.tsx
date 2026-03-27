'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { Decor } from '@/features/decor/types'
import { preloadDecorTiles } from '@/features/decor/tile-loader'

import { DecorCard } from './DecorCard'
import { DecorSearch } from './DecorSearch'
import { useStore } from '@/store'

const ITEMS_PER_ROW = 2
const ROW_HEIGHT = 330

interface DecorDrawerProps {
  sectionId: string
  sectionLabel?: string
  compatibleCategories?: string[]
  decors: Decor[]
  activeDecorCode?: string
  onSelect: (sectionId: string, decor: Decor) => void
  onClose: () => void
}

interface DecorGroup {
  id: string
  label: string
  aliases: string[]
}

const DECOR_GROUPS: DecorGroup[] = [
  {
    id: 'material-reproductions',
    label: 'MATERIAL (REPRODUCTIONS)',
    aliases: ['stone', 'marble', 'concrete', 'mineral', 'granite', 'terrazzo', 'metal', 'slate'],
  },
  { id: 'premium-white', label: 'PREMIUM WHITE', aliases: ['premium-white', 'premiumwhite'] },
  { id: 'white', label: 'WHITE', aliases: ['white'] },
  { id: 'uni', label: 'UNI', aliases: ['uni', 'solid'] },
  {
    id: 'woodgrain-reproductions',
    label: 'WOODGRAIN (REPRODUCTIONS)',
    aliases: [
      'wood',
      'woodgrain',
      'oak',
      'walnut',
      'elm',
      'cherry',
      'ash',
      'pine',
      'birch',
      'maple',
      'acacia',
      'larch',
      'beech',
      'spruce',
    ],
  },
]

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

function resolveGroupId(category: string): string {
  const normalized = normalize(category)
  const group = DECOR_GROUPS.find((candidate) =>
    candidate.aliases.some(
      (alias) =>
        normalized === alias || normalized.includes(alias) || alias.includes(normalized),
    ),
  )

  return group?.id ?? 'material-reproductions'
}

function DecorGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[260px] animate-pulse rounded bg-stone-200" />
      ))}
    </div>
  )
}

export function DecorDrawer({
  sectionId,
  sectionLabel,
  compatibleCategories,
  decors,
  activeDecorCode,
  onSelect,
  onClose,
}: DecorDrawerProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const search = useStore(state => state.drawerSearch)
  const selectedGroupId = useStore(state => state.drawerSelectedGroup)
  const expandedGroupId = useStore(state => state.drawerExpandedGroup)
  const selectedSubCategory = useStore(state => state.drawerSubCategory)
  const setDrawerFilters = useStore(state => state.setDrawerFilters)

  const compatibleSet = useMemo(() => {
    if (!compatibleCategories || compatibleCategories.length === 0) {
      return null
    }

    return new Set(compatibleCategories.map((category) => normalize(category)))
  }, [compatibleCategories])

  const compatibleDecors = useMemo(() => {
    if (!compatibleSet) {
      return decors
    }

    return decors.filter((decor) => compatibleSet.has(normalize(decor.category)))
  }, [compatibleSet, decors])

  const subCategoriesByGroup = useMemo(() => {
    const buckets = new Map<string, string[]>()

    DECOR_GROUPS.forEach((group) => {
      const values = Array.from(
        new Set(
          compatibleDecors
            .filter((decor) => resolveGroupId(decor.category) === group.id)
            .map((decor) => normalize(decor.category)),
        ),
      )
      buckets.set(group.id, values)
    })

    return buckets
  }, [compatibleDecors])

  useEffect(() => {
    // When the component mounts or compatibleDecors changes, 
    // find the first group that actually has decors and select it.
    const firstCompatibleGroup = DECOR_GROUPS.find(group => 
      compatibleDecors.some(decor => resolveGroupId(decor.category) === group.id)
    )

    if (firstCompatibleGroup && (!selectedGroupId || !subCategoriesByGroup.has(selectedGroupId))) {
      setDrawerFilters({
        selectedGroup: firstCompatibleGroup.id,
        expandedGroup: firstCompatibleGroup.id,
        subCategory: 'all'
      })
    }
  }, [compatibleDecors, selectedGroupId, subCategoriesByGroup, setDrawerFilters])

  const filtered = useMemo(
    () =>
      compatibleDecors.filter((decor) => {
        const groupId = resolveGroupId(decor.category)
        const category = normalize(decor.category)

        const groupMatch = groupId === selectedGroupId
        const subCategoryMatch = selectedSubCategory === 'all' || category === selectedSubCategory
        const searchMatch =
          search.length === 0 ||
          decor.name.toLowerCase().includes(search.toLowerCase()) ||
          decor.code.toLowerCase().includes(search.toLowerCase())

        return groupMatch && subCategoryMatch && searchMatch
      }),
    [compatibleDecors, search, selectedGroupId, selectedSubCategory],
  )

  const totalRows = Math.ceil(filtered.length / ITEMS_PER_ROW)
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  const handleResetFilters = () => {
    setDrawerFilters({
      search: '',
      subCategory: 'all'
    })
  }

  return (
    <aside className="fixed inset-2 z-50 rounded-xl border border-stone-300 bg-stone-100 shadow-2xl md:inset-4">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-stone-300 px-6 py-4">
          <div>
            <h2 className="text-4xl font-light text-stone-900">{sectionLabel ?? 'Furniture decors'}</h2>
            <p className="mt-1 text-sm text-stone-600">Choose a desired decor.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 hover:border-stone-500"
          >
            Close
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 p-4 md:grid-cols-[300px,1fr]">
          <section className="min-h-0 overflow-y-auto rounded border border-stone-300 bg-white p-4">
            <DecorSearch value={search} onChange={(val) => setDrawerFilters({ search: val })} />

            <div className="mt-4 space-y-3">
              {DECOR_GROUPS.map((group) => {
                const subCategories = subCategoriesByGroup.get(group.id) ?? []
                const expanded = expandedGroupId === group.id
                const selected = selectedGroupId === group.id

                return (
                  <div key={group.id} className="border-b border-stone-200 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerFilters({
                          expandedGroup: expandedGroupId === group.id ? null : group.id,
                          selectedGroup: group.id,
                          subCategory: 'all'
                        })
                      }}
                      className={`flex w-full items-center justify-between text-left text-base ${
                        selected ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'
                      }`}
                    >
                      {group.label}
                      <span className="text-rose-600">{expanded ? '⌄' : '›'}</span>
                    </button>

                    {expanded && subCategories.length > 0 ? (
                      <div className="mt-2 space-y-1 pb-2 pl-1">
                        <button
                          type="button"
                          className={`flex items-center gap-2 text-sm ${
                            selectedSubCategory === 'all' ? 'font-semibold text-stone-900' : 'text-stone-700'
                          }`}
                          onClick={() => {
                            setDrawerFilters({
                              selectedGroup: group.id,
                              subCategory: 'all'
                            })
                          }}
                        >
                          <span
                            className={`h-3.5 w-3.5 rounded-full border ${
                              selectedSubCategory === 'all'
                                ? 'border-stone-900 bg-stone-900'
                                : 'border-stone-300 bg-white'
                            }`}
                          />
                          All
                        </button>
                        {subCategories.map((category) => {
                          const active = selectedSubCategory === category

                          return (
                            <button
                              key={category}
                              type="button"
                              className={`flex items-center gap-2 text-sm ${
                                active ? 'font-semibold text-stone-900' : 'text-stone-700'
                              }`}
                              onClick={() => {
                                setDrawerFilters({
                                  selectedGroup: group.id,
                                  subCategory: category
                                })
                              }}
                            >
                              <span
                                className={`h-3.5 w-3.5 rounded-full border ${
                                  active ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'
                                }`}
                              />
                              {category.replace(/-/g, ' ')}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="min-h-0 rounded border border-stone-300 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm font-medium text-stone-500 hover:text-stone-800"
              >
                ↻ RESET FILTER
              </button>
              <div className="text-sm text-stone-700">
                Decor results <span className="rounded-full bg-rose-100 px-2 py-0.5">{filtered.length}</span>
              </div>
            </div>

            <div ref={parentRef} className="h-[calc(100%-38px)] overflow-auto" data-testid="decor-drawer">
              {compatibleDecors.length === 0 ? (
                <p className="rounded border border-stone-200 bg-stone-50 px-3 py-6 text-sm text-stone-600">
                  No compatible decors for this section.
                </p>
              ) : filtered.length === 0 ? (
                <p className="rounded border border-stone-200 bg-stone-50 px-3 py-6 text-sm text-stone-600">
                  No decors match the selected filter.
                </p>
              ) : (
                <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowStart = virtualRow.index * ITEMS_PER_ROW
                    const rowItems = filtered.slice(rowStart, rowStart + ITEMS_PER_ROW)

                    return (
                      <div
                        key={virtualRow.key}
                        className="absolute left-0 top-0 grid w-full grid-cols-1 gap-4 md:grid-cols-2"
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                      >
                        {rowItems.map((decor) => (
                          <DecorCard
                            key={decor.code}
                            decor={decor}
                            active={decor.code === activeDecorCode}
                            variant="panel"
                            onHover={(candidate) => {
                              void preloadDecorTiles(candidate.tile512, candidate.tile2048)
                            }}
                            onSelect={(selected) => onSelect(sectionId, selected)}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {decors.length === 0 ? <DecorGridSkeleton /> : null}
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
