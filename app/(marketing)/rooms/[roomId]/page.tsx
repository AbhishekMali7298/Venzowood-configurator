import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getDecors } from '@/services/decor-api'
import { getRoom } from '@/services/room-api'

import { RoomStudioClient } from './RoomStudioClient'

interface RoomPageProps {
  params: {
    roomId: string
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

export default async function RoomPage({ params }: RoomPageProps) {
  let roomData: {
    room: Awaited<ReturnType<typeof getRoom>>
    decors: Awaited<ReturnType<typeof getDecors>>
  } | null = null

  try {
    const [room, decors] = await Promise.all([
      getRoom(params.roomId),
      getDecors({ country: 'IN', page: 1, limit: 500 }),
    ])
    roomData = { room, decors }
  } catch {
    roomData = null
  }

  if (!roomData) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-8">Loading room...</div>}>
      <RoomStudioClient room={roomData.room} decors={roomData.decors.decors} />
    </Suspense>
  )
}
