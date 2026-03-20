import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { RoomSkeleton } from '@/components/room/RoomSkeleton'
import { getDecors } from '@/services/decor-api'
import { getRoom } from '@/services/room-api'

import { RoomStudioClient } from './RoomStudioClient'

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
  } catch {
    roomData = null
  }

  if (!roomData) {
    notFound()
  }

  const projectFromQuery = Array.isArray(searchParams?.project)
    ? (searchParams?.project[0] ?? null)
    : (searchParams?.project ?? null)

  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomStudioClient
        room={roomData.room}
        decors={roomData.decors.decors}
        projectFromQuery={projectFromQuery}
      />
    </Suspense>
  )
}
