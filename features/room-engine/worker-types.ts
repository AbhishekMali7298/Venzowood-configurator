export interface CompositorWorkerRequest {
  requestId: string
  sectionId: string
  decorTileUrl: string
  uvMaskUrl: string
  canvasWidth: number
  canvasHeight: number
  tileScale: number
}

export interface CompositorWorkerSuccess {
  requestId: string
  sectionId: string
  bitmap: ImageBitmap
}

export interface CompositorWorkerFailure {
  requestId: string
  sectionId: string
  error: string
}

export type CompositorWorkerResponse = CompositorWorkerSuccess | CompositorWorkerFailure
