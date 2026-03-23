import { getDecors } from '@/services/decor-api'
import { getRooms } from '@/services/room-api'
import { ApiConnectionError } from '@/services/api-client'

import { RoomBrowserClient } from './RoomBrowserClient'

export const revalidate = 86400
export const metadata = {
  title: 'DecorViz | Rooms',
  description: 'Browse customizable room scenes in the DecorViz virtual studio.',
}

export default async function RoomsPage() {
  let backendUnavailable = false
  let roomsResponse: Awaited<ReturnType<typeof getRooms>> = { rooms: [], total: 0 }
  let decorResponse: Awaited<ReturnType<typeof getDecors>> = { decors: [], page: 1, limit: 100, total: 0 }

  try {
    ;[roomsResponse, decorResponse] = await Promise.all([
      getRooms(),
      getDecors({ country: 'IN', page: 1, limit: 100 }),
    ])
  } catch (error) {
    if (error instanceof ApiConnectionError) {
      backendUnavailable = true
    } else {
      throw error
    }
  }

  return (
    <RoomBrowserClient
      rooms={roomsResponse.rooms}
      initialDecors={decorResponse.decors}
      backendUnavailable={backendUnavailable}
    />
  )
}
