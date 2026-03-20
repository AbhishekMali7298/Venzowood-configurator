import type { Room, RoomListItem } from '@/features/room-engine/types'

import { apiRequest } from './api-client'

export interface RoomsResponse {
  rooms: RoomListItem[]
  total: number
}

export async function getRooms(
  params: { country?: string; category?: string } = {},
): Promise<RoomsResponse> {
  const query = new URLSearchParams()

  if (params.country) {
    query.set('country', params.country)
  }

  if (params.category) {
    query.set('category', params.category)
  }

  const suffix = query.size ? `?${query.toString()}` : ''

  return apiRequest<RoomsResponse>(`/rooms${suffix}`)
}

export async function getRoom(id: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${id}`)
}
