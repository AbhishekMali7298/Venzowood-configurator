import type {
  CompositorWorkerRequest,
  CompositorWorkerResponse,
} from '@/features/room-engine/worker-types'

interface PendingRequest {
  resolve: (bitmap: ImageBitmap) => void
  reject: (error: Error) => void
  sectionId: string
}

interface MaskedSurfaceInput {
  sectionId: string
  decorTileUrl: string
  uvMaskUrl: string
  canvasWidth: number
  canvasHeight: number
  tileScale: number
}

function createRequestId(sectionId: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${sectionId}-${crypto.randomUUID()}`
  }

  return `${sectionId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

export class CompositorWorkerClient {
  private worker: Worker
  private pending = new Map<string, PendingRequest>()

  constructor() {
    this.worker = new Worker(new URL('../../workers/compositor.worker.ts', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = this.handleMessage
    this.worker.onerror = this.handleError
  }

  async createMaskedSurface(input: MaskedSurfaceInput): Promise<ImageBitmap> {
    const requestId = createRequestId(input.sectionId)

    const payload: CompositorWorkerRequest = {
      requestId,
      sectionId: input.sectionId,
      decorTileUrl: input.decorTileUrl,
      uvMaskUrl: input.uvMaskUrl,
      canvasWidth: input.canvasWidth,
      canvasHeight: input.canvasHeight,
      tileScale: input.tileScale,
    }

    return new Promise<ImageBitmap>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve,
        reject,
        sectionId: input.sectionId,
      })

      this.worker.postMessage(payload)
    })
  }

  terminate(): void {
    this.pending.forEach((request) => {
      request.reject(new Error('Worker terminated before compositing completed'))
    })
    this.pending.clear()
    this.worker.terminate()
  }

  private handleMessage = (event: MessageEvent<CompositorWorkerResponse>): void => {
    const message = event.data
    const request = this.pending.get(message.requestId)

    if (!request) {
      return
    }

    this.pending.delete(message.requestId)

    if ('bitmap' in message) {
      request.resolve(message.bitmap)
      return
    }

    request.reject(new Error(message.error))
  }

  private handleError = (): void => {
    this.pending.forEach((request) => {
      request.reject(new Error(`Worker error while processing section ${request.sectionId}`))
    })
    this.pending.clear()
  }
}
