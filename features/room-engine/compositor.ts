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

    await this.drawLayer(room.layers.shadow, 'multiply')

    if (room.layers.reflection) {
      await this.drawLayer(room.layers.reflection, 'screen')
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

    const tile = await this.loadImage(tileUrl)
    const mask = await this.loadMaskOrFallback(section)

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
    const alphaMask = this.normalizeMaskToAlpha(mask as CanvasImageSource)
    surfaceCtx.drawImage(alphaMask as CanvasImageSource, 0, 0, this.width, this.height)

    this.ctx.drawImage(surface as CanvasImageSource, 0, 0)
  }

  private async loadMaskOrFallback(
    section: RoomSection,
  ): Promise<HTMLImageElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement> {
    try {
      return await this.loadImage(section.uvMask, { allowFallback: false })
    } catch (error) {
      console.warn(
        `UV mask failed for section "${section.id}" (${section.uvMask}). Falling back to hotspot mask.`,
        error,
      )
      return this.createHotspotFallbackMask(section.hotspot.nx, section.hotspot.ny)
    }
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

  private async loadImage(
    url: string,
    options?: { allowFallback?: boolean },
  ): Promise<HTMLImageElement | ImageBitmap> {
    const allowFallback = options?.allowFallback ?? true

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
      if (!allowFallback || typeof Image === 'undefined') {
        throw bitmapError
      }

      const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const fallbackSrc =
          'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="100%25" height="100%25" fill="none" /%3E%3Ccircle cx="64" cy="64" r="16" fill="rgba(255,0,0,0.5)" /%3E%3C/svg%3E'
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

  private createHotspotFallbackMask(nx: number, ny: number): OffscreenCanvas | HTMLCanvasElement {
    const surface = this.createCompositingSurface()
    const ctx = surface.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null

    if (!ctx) {
      return surface
    }

    const cx = Math.round(nx * this.width)
    const cy = Math.round(ny * this.height)
    const radius = Math.max(48, Math.round(Math.min(this.width, this.height) * 0.1))
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    return surface
  }

  private normalizeMaskToAlpha(mask: CanvasImageSource): CanvasImageSource {
    const surface = this.createCompositingSurface()
    const ctx = surface.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null

    if (!ctx) {
      return mask
    }

    ctx.clearRect(0, 0, this.width, this.height)
    ctx.drawImage(mask, 0, 0, this.width, this.height)

    if (typeof ctx.getImageData !== 'function' || typeof ctx.putImageData !== 'function') {
      return mask
    }

    // Support both transparent masks and black/white opaque masks:
    // convert luminance into alpha so white keeps decor and black removes it.
    const imageData = ctx.getImageData(0, 0, this.width, this.height)
    const { data } = imageData

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const srcAlpha = (data[i + 3] ?? 0) / 255
      const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
      const alpha = Math.round(luminance * srcAlpha)

      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = alpha
    }

    ctx.putImageData(imageData, 0, 0)
    return surface
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
