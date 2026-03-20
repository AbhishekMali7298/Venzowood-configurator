import type { Decor } from '@/features/decor/types'

export interface RoomListItem {
  id: string
  name: string
  category: 'private' | 'public'
  thumb: string
  sectionCount: number
  availability: Record<string, boolean>
}

export interface Room {
  id: string
  name: string
  category?: 'private' | 'public'
  width: number
  height: number
  thumb?: string
  layers: {
    base: string
    shadow: string
    reflection?: string
  }
  sections: RoomSection[]
  furniture?: FurniturePiece[]
  availability?: Record<string, boolean>
}

export interface RoomSection {
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
  defaultDecor?: Decor
  compatibleCategories: string[]
  renderOrder: number
}

export interface FurniturePiece {
  id: string
  src: string
  zIndex: number
}
