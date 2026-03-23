import type { Decor } from '@/features/decor/types'
import type { Room } from '@/features/room-engine/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RoomCompositor } from './compositor'

class FakePattern {
  setTransform = vi.fn()
}

class FakeCanvasContext {
  operations: string[] = []
  fillStyle: string | CanvasGradient | CanvasPattern = '#000'

  private composite: GlobalCompositeOperation = 'source-over'

  get globalCompositeOperation(): GlobalCompositeOperation {
    return this.composite
  }

  set globalCompositeOperation(value: GlobalCompositeOperation) {
    this.composite = value
    this.operations.push(`gco:${value}`)
  }

  clearRect = vi.fn(() => {
    this.operations.push('clearRect')
  })

  drawImage = vi.fn((image: CanvasImageSource) => {
    const marker = image instanceof FakeOffscreenCanvas ? 'offscreen' : 'image'
    this.operations.push(`draw:${marker}:${this.composite}`)
  })

  fillRect = vi.fn(() => {
    this.operations.push('fillRect')
  })

  createPattern = vi.fn(() => new FakePattern() as unknown as CanvasPattern)
}

class FakeOffscreenCanvas {
  static created: FakeOffscreenCanvas[] = []

  readonly context = new FakeCanvasContext()

  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    FakeOffscreenCanvas.created.push(this)
  }

  getContext(_kind: '2d'): OffscreenCanvasRenderingContext2D {
    return this.context as unknown as OffscreenCanvasRenderingContext2D
  }

  transferToImageBitmap(): ImageBitmap {
    return { close: () => undefined } as unknown as ImageBitmap
  }
}

function createMockRoom(): Room {
  return {
    id: 'living-room-01',
    name: 'Living Room',
    width: 1920,
    height: 1080,
    layers: {
      base: 'base.webp',
      shadow: 'shadow.webp',
      reflection: 'reflection.webp',
    },
    sections: [
      {
        id: 'wall-main',
        label: 'Main Wall',
        surfaceType: 'wall',
        hotspot: { nx: 0.4, ny: 0.3 },
        uvMask: 'uv-mask.webp',
        tileScale: 1,
        defaultDecorCode: 'H1111_ST10',
        compatibleCategories: ['wood'],
        renderOrder: 1,
      },
    ],
    furniture: [],
  }
}

function createMockDecor(): Decor {
  return {
    code: 'H1145_ST10',
    name: 'Blarney Stone Light',
    category: 'stone',
    thumb: 'thumb.webp',
    tile512: 'tile-512.webp',
    tile2048: 'tile-2048.webp',
    gloss: 0.2,
    availability: { IN: true },
  }
}

describe('RoomCompositor', () => {
  let originalOffscreenCanvas: typeof OffscreenCanvas | undefined
  let originalDomMatrix: typeof DOMMatrix | undefined

  beforeEach(() => {
    FakeOffscreenCanvas.created = []
    originalOffscreenCanvas = globalThis.OffscreenCanvas
    originalDomMatrix = globalThis.DOMMatrix
    ;(globalThis as Record<string, unknown>).OffscreenCanvas = FakeOffscreenCanvas
    ;(globalThis as Record<string, unknown>).DOMMatrix = class {
      scaleSelf(): this {
        return this
      }
    }
  })

  afterEach(() => {
    if (originalOffscreenCanvas) {
      globalThis.OffscreenCanvas = originalOffscreenCanvas
    } else {
      delete (globalThis as Record<string, unknown>).OffscreenCanvas
    }

    if (originalDomMatrix) {
      globalThis.DOMMatrix = originalDomMatrix
    } else {
      delete (globalThis as Record<string, unknown>).DOMMatrix
    }
  })

  it('applies UV masking with destination-in while compositing decor', async () => {
    const mainCtx = new FakeCanvasContext()
    const canvas = {
      getContext: vi.fn(() => mainCtx),
    } as unknown as HTMLCanvasElement

    const compositor = new RoomCompositor({
      canvas,
      width: 1920,
      height: 1080,
    })

    const loadImageSpy = vi
      .spyOn(
        compositor as unknown as {
          loadImage: (
            url: string,
            options?: { allowFallback?: boolean },
          ) => Promise<CanvasImageSource>
        },
        'loadImage',
      )
      .mockImplementation(async (url: string) => ({ url }) as unknown as CanvasImageSource)

    const room = createMockRoom()
    const decor = createMockDecor()

    await compositor.render({
      room,
      sectionDecors: new Map([['wall-main', decor]]),
      quality: 'low',
    })

    const surface = FakeOffscreenCanvas.created[0]
    expect(surface).toBeDefined()
    expect(surface?.context.operations).toContain('gco:destination-in')

    expect(loadImageSpy).toHaveBeenCalledWith('uv-mask.webp', { allowFallback: false })
    expect(loadImageSpy).toHaveBeenCalledWith('tile-512.webp')

    expect(mainCtx.operations).toContain('gco:multiply')
    expect(mainCtx.operations).toContain('gco:screen')
    expect(mainCtx.operations).toContain('draw:offscreen:source-over')
  })

  it('uses tile-2048 for high-quality renders', async () => {
    const mainCtx = new FakeCanvasContext()
    const canvas = {
      getContext: vi.fn(() => mainCtx),
    } as unknown as HTMLCanvasElement

    const compositor = new RoomCompositor({
      canvas,
      width: 1920,
      height: 1080,
    })

    const loadImageSpy = vi
      .spyOn(
        compositor as unknown as {
          loadImage: (
            url: string,
            options?: { allowFallback?: boolean },
          ) => Promise<CanvasImageSource>
        },
        'loadImage',
      )
      .mockImplementation(async (url: string) => ({ url }) as unknown as CanvasImageSource)

    await compositor.render({
      room: createMockRoom(),
      sectionDecors: new Map([['wall-main', createMockDecor()]]),
      quality: 'high',
    })

    expect(loadImageSpy).toHaveBeenCalledWith('tile-2048.webp')
  })
})
