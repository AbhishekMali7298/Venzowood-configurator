'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import type { Decor } from '@/features/decor/types'
import type { RoomListItem } from '@/features/room-engine/types'

interface RoomBrowserClientProps {
  rooms: RoomListItem[]
  initialDecors: Decor[]
  backendUnavailable?: boolean
}

function toSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function roomThumbPlaceholder(label: string): string {
  const safeLabel = escapeXml(label)
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'><rect width='100%' height='100%' fill='#e8e4dc'/><rect x='48' y='68' width='240' height='164' fill='#ffffff' opacity='0.78'/><rect x='320' y='96' width='260' height='208' fill='#d5d0c7'/><text x='48' y='312' fill='#5f5b52' font-family='Arial, sans-serif' font-size='28'>${safeLabel}</text></svg>`,
  )
}

function shouldUsePlaceholders(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDERS !== 'false'
}

function shouldUsePlaceholderThumb(src: string): boolean {
  return shouldUsePlaceholders() && /^https?:\/\//i.test(src)
}

function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function RoomThumbnail({ src, alt }: { src: string; alt: string }) {
  const placeholder = roomThumbPlaceholder(alt)
  const [thumbSrc, setThumbSrc] = useState(shouldUsePlaceholderThumb(src) ? placeholder : src)

  return (
    <Image
      src={thumbSrc}
      alt={alt}
      className="h-full w-full object-cover"
      width={640}
      height={400}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 50vw"
      unoptimized={thumbSrc.startsWith('data:image')}
      onError={() => setThumbSrc(placeholder)}
    />
  )
}

export function RoomBrowserClient({
  rooms,
  initialDecors,
  backendUnavailable = false,
}: RoomBrowserClientProps) {
  const [category, setCategory] = useState<'all' | 'private' | 'public'>('all')
  const [roomTag, setRoomTag] = useState<string>('all')

  const privateRooms = useMemo(() => rooms.filter((room) => room.category === 'private'), [rooms])
  const publicRooms = useMemo(() => rooms.filter((room) => room.category === 'public'), [rooms])

  const filteredRooms = useMemo(() => {
    const byCategory = category === 'all' ? rooms : rooms.filter((room) => room.category === category)
    if (roomTag === 'all') {
      return byCategory
    }

    return byCategory.filter((room) => normalizeTag(room.name) === roomTag)
  }, [category, roomTag, rooms])

  const resetFilters = () => {
    setCategory('all')
    setRoomTag('all')
  }

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="mx-auto max-w-[1380px] px-4 pb-10 pt-8 md:px-8">
        {backendUnavailable ? (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Backend API is not reachable. Start backend with `cd backend && npm run dev` (port 8080),
            then refresh this page.
          </div>
        ) : null}

        <div className="mb-6 flex items-end justify-between border-b border-stone-300 pb-3">
          <h1 className="text-4xl font-light tracking-tight text-stone-900">Rooms</h1>
          <p className="hidden text-xl font-light text-stone-800 md:block">Choose your room</p>
        </div>

        <div className="grid gap-6 lg:h-[calc(100vh-180px)] lg:grid-cols-[300px,1fr] lg:overflow-hidden">
          <aside className="rounded-md border border-stone-300 bg-stone-50 p-5 lg:sticky lg:top-0">
            <div className="space-y-6 text-stone-900">
              <section>
                <div className="mb-3 flex w-full items-center justify-between text-left text-lg font-semibold tracking-wide">
                  PRIVATE
                  <span className="text-rose-500">⌄</span>
                </div>
                <div className="space-y-2">
                  {privateRooms.map((room) => {
                    const tag = normalizeTag(room.name)
                    const selected = category === 'private' && roomTag === tag
                    return (
                      <button
                        key={room.id}
                        type="button"
                        className="flex w-full items-center gap-2 text-left text-[1.05rem] text-stone-800"
                        onClick={() => {
                          setCategory('private')
                          setRoomTag(tag)
                        }}
                      >
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            selected ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'
                          }`}
                        />
                        <span>{room.name}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section>
                <div className="flex w-full items-center justify-between text-left text-lg font-semibold tracking-wide">
                  PUBLIC
                  <span className="text-rose-500">⌄</span>
                </div>
                <div className="mt-2 space-y-2">
                  {publicRooms.length === 0 ? (
                    <p className="text-sm text-stone-500">No public rooms available.</p>
                  ) : (
                    publicRooms.map((room) => {
                      const tag = normalizeTag(room.name)
                      const selected = category === 'public' && roomTag === tag
                      return (
                        <button
                          key={room.id}
                          type="button"
                          className="flex w-full items-center gap-2 text-left text-[1.05rem] text-stone-800"
                          onClick={() => {
                            setCategory('public')
                            setRoomTag(tag)
                          }}
                        >
                          <span
                            className={`h-4 w-4 rounded-full border ${
                              selected ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'
                            }`}
                          />
                          <span>{room.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="border-t border-stone-300 pt-5">
                <h3 className="text-lg font-semibold tracking-wide">LOAD PROJECT</h3>
                <p className="mt-2 text-xs text-stone-600">
                  Enter the project ID of a project saved previously in order to load it again.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    className="h-10 flex-1 border border-stone-300 bg-white px-3 text-sm text-stone-800 outline-none ring-0 placeholder:text-stone-400"
                    placeholder="Project ID"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim()
                        if (val) window.location.href = `/projects/${val}`
                      }
                    }}
                    id="project-id-input"
                  />
                  <button
                    type="button"
                    className="h-10 w-10 bg-rose-600 text-xl text-white transition hover:bg-rose-700"
                    aria-label="Load project"
                    onClick={() => {
                      const input = document.getElementById('project-id-input') as HTMLInputElement
                      const val = input.value.trim()
                      if (val) window.location.href = `/projects/${val}`
                    }}
                  >
                    ›
                  </button>
                </div>
              </section>
            </div>
          </aside>

          <section className="lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium tracking-wide text-stone-400 hover:text-stone-600"
                onClick={resetFilters}
              >
                ↻ RESET FILTER
              </button>
              <div className="flex items-center gap-3">
                <p className="text-base text-stone-900">Room results</p>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-stone-900">
                  {filteredRooms.length}
                </span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {filteredRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  className="group overflow-hidden border border-stone-300 bg-white"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-200">
                    <RoomThumbnail src={room.thumb} alt={room.name} />
                  </div>
                  <div className="border-t border-stone-200 px-4 py-3">
                    <p className="text-lg font-medium text-stone-900 transition group-hover:text-rose-700">
                      {room.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {room.category} · {room.sectionCount} surfaces
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="mt-6 rounded-md border border-stone-300 bg-white p-8 text-sm text-stone-600">
                No rooms match this filter. Try reset filter.
              </div>
            ) : null}
          </section>
        </div>

        <p className="mt-8 text-sm text-stone-500">
          {initialDecors.length} decors preloaded for instant customization
        </p>
      </div>
    </main>
  )
}
