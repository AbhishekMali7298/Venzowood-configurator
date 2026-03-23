import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RoomSkeleton } from '@/components/room/RoomSkeleton'
import { ApiConnectionError } from '@/services/api-client'
import { getDecors } from '@/services/decor-api'
import { getRoom } from '@/services/room-api'

const RoomStudioClient = dynamic(
  () => import('./RoomStudioClient').then((module) => module.RoomStudioClient),
  {
    loading: () => <RoomSkeleton />,
    ssr: false,
  },
)

interface RoomPageProps {
  params: {
    roomId: string
  }
  searchParams?: {
    project?: string | string[]
  }
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  try {
    const room = await getRoom(params.roomId)
    return {
      title: `DecorViz | ${room.name}`,
      description: `Customize ${room.name} with canvas-based compositing.`,
    }
  } catch {
    return {
      title: 'DecorViz | Room',
    }
  }
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  let backendUnavailable = false
  let roomData: {
    room: Awaited<ReturnType<typeof getRoom>>
    decors: Awaited<ReturnType<typeof getDecors>>
  } | null = null

  try {
    const [room, decors] = await Promise.all([
      getRoom(params.roomId),
      getDecors({ country: 'IN', page: 1, limit: 100 }),
    ])
    roomData = { room, decors }
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      backendUnavailable = true
    } else {
      roomData = null
    }
  }

  if (!roomData && !backendUnavailable) {
    notFound()
  }

  if (backendUnavailable) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-xl font-semibold">Backend is not running</h1>
          <p className="mt-2 text-sm">
            Start backend with `cd backend && npm run dev` and keep it running on port 8080.
          </p>
          <Link
            href="/rooms"
            className="mt-4 inline-block rounded border border-amber-400 px-4 py-2 text-sm hover:bg-amber-100"
          >
            Back to rooms
          </Link>
        </div>
      </main>
    )
  }

  const resolvedRoomData = roomData as NonNullable<typeof roomData>

  const projectFromQuery = Array.isArray(searchParams?.project)
    ? (searchParams?.project[0] ?? null)
    : (searchParams?.project ?? null)

  return (
    <RoomStudioClient
      room={resolvedRoomData.room}
      decors={resolvedRoomData.decors.decors}
      projectFromQuery={projectFromQuery}
    />
  )
}
