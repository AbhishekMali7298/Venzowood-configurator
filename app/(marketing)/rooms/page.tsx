import Link from 'next/link'

import { getRooms } from '@/services/room-api'

export const revalidate = 86400

export default async function RoomsPage() {
  const { rooms } = await getRooms()

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-stone-900">Rooms</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="rounded-xl border border-stone-300 bg-white p-5 transition hover:border-stone-500"
          >
            <p className="text-lg font-medium text-stone-900">{room.name}</p>
            <p className="mt-2 text-sm text-stone-600">{room.category}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
