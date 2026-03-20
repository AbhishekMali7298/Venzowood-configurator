import type { Decor } from '@/features/decor/types'
import type { Room } from '@/features/room-engine/types'

function toSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function baseLayer(roomId: string): string {
  // Use the exact same static images that act as thumbnails so the selected room matches!
  const images: Record<string, string> = {
    'living-room-01': '/static/rooms/room1.jpg',
    'kitchen-room-01': '/static/rooms/room2.jpg',
    'dining-room-01': '/static/rooms/room3.jpg',
    'bedroom-room-01': '/static/rooms/room4.jpg',
    'family-room-01': '/static/rooms/room5.jpg',
    'office-room-01': '/static/rooms/room7.jpg',
    'retail-room-01': '/static/rooms/room8.jpg',
    'studio-room-01': '/static/rooms/room9.jpg',
    'showroom-room-01': '/static/rooms/room10.jpg',
    'workspace-room-01': '/static/rooms/room11.jpg',
  }

  return images[roomId] || '/static/rooms/room1.jpg'
}

function uvMask(width: number, height: number, nx: number, ny: number): string {
  const cx = Math.round(nx * width)
  const cy = Math.round(ny * height)
  const r = Math.round(Math.min(width, height) * 0.2) // 20% radius

  // We draw a soft circle around the actual hotspot so the decor applies locally
  // The background is kept completely transparent so `destination-in` masks out the rest of the decor image.
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
      <defs>
        <filter id="blurId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
        </filter>
      </defs>
      <circle cx='${cx}' cy='${cy}' r='${r}' fill='white' filter='url(#blurId)' />
    </svg>`,
  )
}

function shadowMap(width: number, height: number): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#000' stop-opacity='0.1'/><stop offset='100%' stop-color='#000' stop-opacity='0.4'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`,
  )
}

function reflectionMap(width: number, height: number): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><radialGradient id='r' cx='20%' cy='15%' r='70%'><stop offset='0%' stop-color='#fff' stop-opacity='0.15'/><stop offset='100%' stop-color='#fff' stop-opacity='0'/></radialGradient></defs><rect width='100%' height='100%' fill='url(#r)'/></svg>`,
  )
}

function decorTile(colorA: string, colorB: string): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><rect width='100%' height='100%' fill='${colorA}'/><path d='M0 0 L512 512 M-128 128 L384 640 M128 -128 L640 384' stroke='${colorB}' stroke-width='32' opacity='0.3'/></svg>`,
  )
}

function mapDecorToPlaceholder(decor: Decor, index: number): Decor {
  const palettes: Array<[string, string]> = [
    ['#8a7051', '#5c4933'],
    ['#a5a198', '#6d6a62'],
    ['#cabcb1', '#9a8d81'],
    ['#5c534e', '#3a3431'],
    ['#d1c3b4', '#a19486'],
  ]
  const [a, b] = palettes[index % palettes.length] as [string, string]
  const tile = decorTile(a, b)

  return {
    ...decor,
    thumb: tile,
    tile512: tile,
    tile2048: tile,
  }
}

export function applyPlaceholderAssets(
  room: Room,
  decors: Decor[],
): { room: Room; decors: Decor[] } {
  const width = room.width || 1920
  const height = room.height || 1080

  const mappedRoom: Room = {
    ...room,
    layers: {
      base: baseLayer(room.id),
      shadow: shadowMap(width, height),
      reflection: reflectionMap(width, height),
    },
    sections: room.sections.map((section) => ({
      ...section,
      uvMask: uvMask(width, height, section.hotspot.nx, section.hotspot.ny),
    })),
    furniture: [],
  }

  const mappedDecors = decors.map((decor, index) => mapDecorToPlaceholder(decor, index))

  return {
    room: mappedRoom,
    decors: mappedDecors,
  }
}

