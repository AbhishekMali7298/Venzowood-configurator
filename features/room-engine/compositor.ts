import type { Decor } from '@/features/decor/types'
import { CompositorWorkerClient } from '@/features/room-engine/compositor-worker-client'

import type { Room, RoomSection } from './types'

export interface CompositorConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas
  width: number
  height: number
  workerClient?: CompositorWorkerClient | null
}

export interface RenderPayload {
  room: Room
  sectionDecors: Map<string, Decor>
  quality: 'low' | 'high'
}

type CompositorContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export class RoomCompositor {
  private ctx: CompositorContext
  private imageCache: Map<string, HTMLImageElement | ImageBitmap> = new Map()
  private width: number
  private height: number
  private workerClient: CompositorWorkerClient | null

  constructor(config: CompositorConfig) {
    const context = config.canvas.getContext('2d')
    if (!context) {
      throw new Error('2D context not available for RoomCompositor')
    }

    this.ctx = context as CompositorContext
    this.width = config.width
    this.height = config.height
    this.workerClient = config.workerClient ?? null
  }

  async render(payload: RenderPayload): Promise<void> {
    const { room, sectionDecors, quality } = payload
    const ctx = this.ctx

    ctx.clearRect(0, 0, this.width, this.height)

    await this.drawLayer(room.layers.base)

    for (const section of room.sections) {
      const decor = sectionDecors.get(section.id)
      if (decor) {
        await this.drawDecorSurface(section, decor, quality)
      }
    }

    for (const piece of room.furniture ?? []) {
      await this.drawLayer(piece.src, 'source-over')
    }

    ctx.globalCompositeOperation = 'multiply'
    await this.drawLayer(room.layers.shadow)
    ctx.globalCompositeOperation = 'source-over'

    if (room.layers.reflection) {
      ctx.globalCompositeOperation = 'screen'
      await this.drawLayer(room.layers.reflection)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  async renderBase(baseLayerUrl: string): Promise<void> {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    await this.drawLayer(baseLayerUrl)
  }

  private async drawDecorSurface(
    section: RoomSection,
    decor: Decor,
    quality: 'low' | 'high',
  ): Promise<void> {
    const tileUrl = quality === 'high' ? decor.tile2048 : decor.tile512

    if (this.workerClient) {
      try {
        const bitmap = await this.workerClient.createMaskedSurface({
          sectionId: section.id,
          decorTileUrl: tileUrl,
          uvMaskUrl: section.uvMask,
          canvasWidth: this.width,
          canvasHeight: this.height,
          tileScale: section.tileScale ?? 1,
        })

        this.ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        return
      } catch {
        // Fallback to main-thread compositing when worker path fails.
      }
    }

    const [mask, tile] = await Promise.all([
      this.loadImage(section.uvMask),
      this.loadImage(tileUrl),
    ])

    const surface = this.createCompositingSurface()
    const surfaceCtx = surface.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null

    if (!surfaceCtx) {
      return
    }

    const pattern = surfaceCtx.createPattern(tile as CanvasImageSource, 'repeat')
    if (!pattern) {
      return
    }

    const matrix = new DOMMatrix()
    matrix.scaleSelf(section.tileScale ?? 1, section.tileScale ?? 1)
    pattern.setTransform(matrix)

    surfaceCtx.fillStyle = pattern
    surfaceCtx.fillRect(0, 0, this.width, this.height)

    surfaceCtx.globalCompositeOperation = 'destination-in'
    surfaceCtx.drawImage(mask as CanvasImageSource, 0, 0, this.width, this.height)

    this.ctx.drawImage(surface as CanvasImageSource, 0, 0)
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

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${url} (${response.status})`)
      }

      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)
      this.imageCache.set(url, bitmap)
      return bitmap
    } catch (bitmapError) {
      if (typeof Image === 'undefined') {
        throw bitmapError
      }

      const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const fallbackSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="100%25" height="100%25" fill="%23e5e5e5" /%3E%3Ccrcle cx="64" cy="64" r="16" fill="%23999" /%3E%3C/svg%3E'
        const image = new Image()
        image.decoding = 'async'
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => {
          console.warn(`Failed to decode image: ${url}. Displaying placeholder.`)
          const fallback = new Image()
          fallback.onload = () => resolve(fallback)
          fallback.onerror = () => reject(new Error(`Fallback failed for: ${url}`))
          fallback.src = fallbackSrc
        }
        image.src = url
      })

      this.imageCache.set(url, imageElement)
      return imageElement
    }
  }

  private createCompositingSurface(): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(this.width, this.height)
    }

    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    return canvas
  }

  clearCache(): void {
    this.imageCache.forEach((image) => {
      if (image instanceof ImageBitmap) {
        image.close()
      }
    })
    this.imageCache.clear()
  }
}
