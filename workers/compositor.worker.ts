/// <reference lib="webworker" />

import type {
  CompositorWorkerRequest,
  CompositorWorkerResponse,
  CompositorWorkerSuccess,
  CompositorWorkerFailure,
} from '@/features/room-engine/worker-types'

async function loadBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`)
  }

  const blob = await response.blob()
  return createImageBitmap(blob)
}

const worker = self as unknown as DedicatedWorkerGlobalScope

worker.onmessage = async (event: MessageEvent<CompositorWorkerRequest>) => {
  const { requestId, sectionId, decorTileUrl, uvMaskUrl, canvasWidth, canvasHeight, tileScale } =
    event.data

  try {
    const [tile, mask] = await Promise.all([loadBitmap(decorTileUrl), loadBitmap(uvMaskUrl)])

    const offscreen = new OffscreenCanvas(canvasWidth, canvasHeight)
    const ctx = offscreen.getContext('2d')

    if (!ctx) {
      throw new Error('Worker compositing context unavailable')
    }

    const pattern = ctx.createPattern(tile, 'repeat')
    if (!pattern) {
      throw new Error('Unable to create worker decor pattern')
    }

    const matrix = new DOMMatrix()
    matrix.scaleSelf(tileScale, tileScale)
    pattern.setTransform(matrix)

    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(mask, 0, 0, canvasWidth, canvasHeight)

    const bitmap = offscreen.transferToImageBitmap()

    const payload: CompositorWorkerSuccess = {
      requestId,
      sectionId,
      bitmap,
    }

    worker.postMessage(payload as CompositorWorkerResponse, [bitmap])
  } catch (error) {
    const payload: CompositorWorkerFailure = {
      requestId,
      sectionId,
      error: error instanceof Error ? error.message : 'Unknown worker error',
    }

    worker.postMessage(payload as CompositorWorkerResponse)
  }
}

export {}
