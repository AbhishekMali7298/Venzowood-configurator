import type { Decor } from '@/features/decor/types'
import type { Room } from '@/features/room-engine/types'

function toSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function baseLayer(width: number, height: number): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='#e8e4dc'/></svg>`,
  )
}

function uvMask(width: number, height: number): string {
  const maskWidth = Math.round(width * 0.3)
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='black'/><rect x='0' y='0' width='${maskWidth}' height='${height}' fill='white'/></svg>`,
  )
}

function shadowMap(width: number, height: number): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#000' stop-opacity='0.04'/><stop offset='100%' stop-color='#000' stop-opacity='0.28'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`,
  )
}

function reflectionMap(width: number, height: number): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><radialGradient id='r' cx='20%' cy='15%' r='70%'><stop offset='0%' stop-color='#fff' stop-opacity='0.2'/><stop offset='100%' stop-color='#fff' stop-opacity='0'/></radialGradient></defs><rect width='100%' height='100%' fill='url(#r)'/></svg>`,
  )
}

function decorTile(colorA: string, colorB: string): string {
  return toSvgDataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><rect width='100%' height='100%' fill='${colorA}'/><path d='M0 0 L512 512 M-128 128 L384 640 M128 -128 L640 384' stroke='${colorB}' stroke-width='24' opacity='0.45'/></svg>`,
  )
}

function mapDecorToPlaceholder(decor: Decor, index: number): Decor {
  const palettes: Array<[string, string]> = [
    ['#9e7b5c', '#6d523a'],
    ['#8e8f88', '#5f6058'],
    ['#c6b8a7', '#938879'],
    ['#7b6d5a', '#544a3c'],
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
      base: baseLayer(width, height),
      shadow: shadowMap(width, height),
      reflection: reflectionMap(width, height),
    },
    sections: room.sections.map((section) => ({
      ...section,
      uvMask: uvMask(width, height),
    })),
    furniture: [],
  }

  const mappedDecors = decors.map((decor, index) => mapDecorToPlaceholder(decor, index))

  return {
    room: mappedRoom,
    decors: mappedDecors,
  }
}
