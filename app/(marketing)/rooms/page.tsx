import { getDecors } from '@/services/decor-api'
import { getRooms } from '@/services/room-api'

import { RoomBrowserClient } from './RoomBrowserClient'

export const revalidate = 86400
export const metadata = {
  title: 'DecorViz | Rooms',
  description: 'Browse customizable room scenes in the DecorViz virtual studio.',
}

export default async function RoomsPage() {
  const [roomsResponse, decorResponse] = await Promise.all([
    getRooms(),
    getDecors({ country: 'IN', page: 1, limit: 500 }),
  ])

  return <RoomBrowserClient rooms={roomsResponse.rooms} initialDecors={decorResponse.decors} />
}
