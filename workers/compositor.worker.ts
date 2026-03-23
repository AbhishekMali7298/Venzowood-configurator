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

function normalizeMaskToAlpha(
  mask: ImageBitmap,
  width: number,
  height: number,
): OffscreenCanvas {
  const maskSurface = new OffscreenCanvas(width, height)
  const maskCtx = maskSurface.getContext('2d')

  if (!maskCtx) {
    return maskSurface
  }

  maskCtx.clearRect(0, 0, width, height)
  maskCtx.drawImage(mask, 0, 0, width, height)

  const imageData = maskCtx.getImageData(0, 0, width, height)
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

  maskCtx.putImageData(imageData, 0, 0)
  return maskSurface
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
    const alphaMask = normalizeMaskToAlpha(mask, canvasWidth, canvasHeight)
    ctx.drawImage(alphaMask, 0, 0, canvasWidth, canvasHeight)

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
