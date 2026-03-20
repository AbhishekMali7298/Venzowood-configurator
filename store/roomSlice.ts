import type { StateCreator } from 'zustand'

import type { Room } from '@/features/room-engine/types'

export interface RoomSlice {
  activeRoom: Room | null
  activeSection: string | null
  setRoom: (room: Room | null) => void
  setActiveSection: (id: string | null) => void
}

export const createRoomSlice: StateCreator<RoomSlice, [['zustand/immer', never]], [], RoomSlice> = (
  set,
) => ({
  activeRoom: null,
  activeSection: null,
  setRoom: (room) =>
    set((state) => {
      state.activeRoom = room
    }),
  setActiveSection: (id) =>
    set((state) => {
      state.activeSection = id
    }),
})
