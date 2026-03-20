'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'

import type { Decor } from '@/features/decor/types'
import type { RoomListItem } from '@/features/room-engine/types'

interface RoomBrowserClientProps {
  rooms: RoomListItem[]
  initialDecors: Decor[]
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

function RoomThumbnail({ src, alt }: { src: string; alt: string }) {
  const placeholder = roomThumbPlaceholder(alt)
  const [thumbSrc, setThumbSrc] = useState(shouldUsePlaceholders() ? placeholder : src)

  return (
    <Image
      src={thumbSrc}
      alt={alt}
      className="h-40 w-full object-cover"
      width={640}
      height={400}
      loading="lazy"
      unoptimized={thumbSrc.startsWith('data:image')}
      onError={() => setThumbSrc(placeholder)}
    />
  )
}

export function RoomBrowserClient({ rooms, initialDecors }: RoomBrowserClientProps) {
  const [category, setCategory] = useState<'all' | 'private' | 'public'>('all')

  const filteredRooms = useMemo(() => {
    if (category === 'all') {
      return rooms
    }

    return rooms.filter((room) => room.category === category)
  }, [category, rooms])

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Rooms</h1>
          <p className="text-sm text-stone-600">
            {initialDecors.length} decors preloaded for instant customization
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'private', 'public'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                option === category
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="rounded-xl border border-stone-300 bg-white p-5 transition hover:border-stone-500"
          >
            <div className="mb-3 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <RoomThumbnail src={room.thumb} alt={room.name} />
            </div>
            <p className="text-lg font-medium text-stone-900">{room.name}</p>
            <p className="mt-2 text-sm text-stone-600">{room.category}</p>
            <p className="mt-1 text-xs text-stone-500">{room.sectionCount} surfaces</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
