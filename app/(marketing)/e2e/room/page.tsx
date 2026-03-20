import type { Decor } from '@/features/decor/types'
import type { Room } from '@/features/room-engine/types'

import { RoomStudioClient } from '@/app/(marketing)/rooms/[roomId]/RoomStudioClient'

const decors: Decor[] = [
  {
    code: 'H1145_ST10',
    name: 'Blarney Stone Light',
    category: 'stone',
    thumb: 'https://cdn.decorviz.com/decors/H1145_ST10/thumb.webp',
    tile512: 'https://cdn.decorviz.com/decors/H1145_ST10/tile-512.webp',
    tile2048: 'https://cdn.decorviz.com/decors/H1145_ST10/tile-2048.webp',
    gloss: 0.2,
    availability: { IN: true },
  },
  {
    code: 'H3309_ST28',
    name: 'Gladstone Oak Sand',
    category: 'wood',
    thumb: 'https://cdn.decorviz.com/decors/H3309_ST28/thumb.webp',
    tile512: 'https://cdn.decorviz.com/decors/H3309_ST28/tile-512.webp',
    tile2048: 'https://cdn.decorviz.com/decors/H3309_ST28/tile-2048.webp',
    gloss: 0.15,
    availability: { IN: true },
  },
]

const room: Room = {
  id: 'living-room-01',
  name: 'E2E Living Room',
  category: 'private',
  width: 1920,
  height: 1080,
  thumb: 'https://cdn.decorviz.com/rooms/living-room-01/thumb.webp',
  layers: {
    base: 'https://cdn.decorviz.com/rooms/living-room-01/layers/base.webp',
    shadow: 'https://cdn.decorviz.com/rooms/living-room-01/layers/shadow.webp',
    reflection: 'https://cdn.decorviz.com/rooms/living-room-01/layers/reflection.webp',
  },
  sections: [
    {
      id: 'wall-main',
      label: 'Main Wall',
      surfaceType: 'wall',
      hotspot: { nx: 0.42, ny: 0.3 },
      uvMask: 'https://cdn.decorviz.com/rooms/living-room-01/sections/wall-main/uv-mask.webp',
      tileScale: 0.08,
      defaultDecorCode: 'H1145_ST10',
      compatibleCategories: ['wood', 'stone'],
      renderOrder: 1,
    },
  ],
  furniture: [],
  availability: { IN: true },
}

export default function E2ERoomPage() {
  return <RoomStudioClient room={room} decors={decors} />
}
