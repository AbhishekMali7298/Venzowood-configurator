import type { Room, RoomListItem } from '@/features/room-engine/types'

import { apiRequest } from './api-client'

export interface RoomsResponse {
  rooms: RoomListItem[]
  total: number
}

export interface CreateRoomPayload {
  id: string
  name: string
  category: 'private' | 'public'
  width: number
  height: number
  thumb: string
  layers: {
    base: string
    shadow: string
    reflection?: string
  }
  sections: Array<{
    id: string
    label: string
    surfaceType: 'wall' | 'floor' | 'ceiling' | 'countertop' | 'cabinet' | 'door'
    hotspot: {
      nx: number
      ny: number
    }
    uvMask: string
    tileScale: number
    defaultDecorCode: string
    compatibleCategories: string[]
    renderOrder: number
  }>
  furniture?: Array<{
    id: string
    src: string
    zIndex: number
  }>
  availability: Record<string, boolean>
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

export async function createRoom(payload: CreateRoomPayload): Promise<{ id: string }> {
  return apiRequest<{ id: string }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export async function updateRoom(id: string, payload: CreateRoomPayload): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export async function deleteRoom(id: string): Promise<void> {
  await apiRequest<void>(`/rooms/${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  })
}

