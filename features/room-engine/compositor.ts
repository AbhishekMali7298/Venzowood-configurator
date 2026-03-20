import type { Decor } from '@/features/decor/types'

import type { Room, RoomSection } from './types'

export interface CompositorConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas
  width: number
  height: number
}

export interface RenderPayload {
  room: Room
  sectionDecors: Map<string, Decor>
  quality: 'low' | 'high'
}

export class RoomCompositor {
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private imageCache: Map<string, HTMLImageElement | ImageBitmap> = new Map()
  private width: number
  private height: number

  constructor(config: CompositorConfig) {
    this.ctx = config.canvas.getContext('2d') as CanvasRenderingContext2D
    this.width = config.width
    this.height = config.height
  }

  async render(payload: RenderPayload): Promise<void> {
    const { room, sectionDecors, quality } = payload

    this.ctx.clearRect(0, 0, this.width, this.height)

    await this.drawLayer(room.layers.base)

    const sortedSections = [...room.sections].sort((a, b) => a.renderOrder - b.renderOrder)
    for (const section of sortedSections) {
      const decor = sectionDecors.get(section.id) ?? section.defaultDecor
      if (decor) {
        await this.drawDecorSurface(section, decor, quality)
      }
    }

    const furniture = [...(room.furniture ?? [])].sort((a, b) => a.zIndex - b.zIndex)
    for (const piece of furniture) {
      await this.drawLayer(piece.src, 'source-over')
    }

    this.ctx.globalCompositeOperation = 'multiply'
    await this.drawLayer(room.layers.shadow)
    this.ctx.globalCompositeOperation = 'source-over'

    if (room.layers.reflection) {
      this.ctx.globalCompositeOperation = 'screen'
      await this.drawLayer(room.layers.reflection)
      this.ctx.globalCompositeOperation = 'source-over'
    }
  }

  async renderBase(baseUrl: string): Promise<void> {
    this.ctx.clearRect(0, 0, this.width, this.height)
    await this.drawLayer(baseUrl)
  }

  private async drawDecorSurface(
    section: RoomSection,
    decor: Decor,
    quality: 'low' | 'high',
  ): Promise<void> {
    const tileUrl = quality === 'high' ? decor.tile2048 : decor.tile512
    const [mask, tile] = await Promise.all([
      this.loadImage(section.uvMask),
      this.loadImage(tileUrl),
    ])

    const offscreen = new OffscreenCanvas(this.width, this.height)
    const offCtx = offscreen.getContext('2d')

    if (!offCtx) {
      return
    }

    const pattern = offCtx.createPattern(tile as CanvasImageSource, 'repeat')
    if (!pattern) {
      return
    }

    const matrix = new DOMMatrix()
    matrix.scaleSelf(section.tileScale || 1, section.tileScale || 1)
    pattern.setTransform(matrix)

    offCtx.fillStyle = pattern
    offCtx.fillRect(0, 0, this.width, this.height)

    offCtx.globalCompositeOperation = 'destination-in'
    offCtx.drawImage(mask as CanvasImageSource, 0, 0, this.width, this.height)

    this.ctx.drawImage(offscreen, 0, 0)
  }

  private async drawLayer(
    url: string,
    blendMode: GlobalCompositeOperation = 'source-over',
  ): Promise<void> {
    const img = await this.loadImage(url)
    this.ctx.globalCompositeOperation = blendMode
    this.ctx.drawImage(img as CanvasImageSource, 0, 0, this.width, this.height)
    this.ctx.globalCompositeOperation = 'source-over'
  }

  private async loadImage(url: string): Promise<HTMLImageElement | ImageBitmap> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url) as HTMLImageElement | ImageBitmap
    }

    const response = await fetch(url)
    const blob = await response.blob()
    const img = await createImageBitmap(blob)
    this.imageCache.set(url, img)
    return img
  }

  clearCache(): void {
    this.imageCache.clear()
  }
}
