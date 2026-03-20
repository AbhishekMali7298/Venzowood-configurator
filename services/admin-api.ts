export type UploadAssetType = 'thumb' | 'base' | 'shadow' | 'reflection' | 'uvMask'

interface UploadAssetInput {
  roomId: string
  assetType: UploadAssetType
  file: File
  sectionId?: string
}

interface UploadAssetResponse {
  url: string
}

export async function uploadRoomAsset(input: UploadAssetInput): Promise<UploadAssetResponse> {
  const formData = new FormData()
  formData.set('roomId', input.roomId)
  formData.set('assetType', input.assetType)
  formData.set('file', input.file)
  if (input.sectionId) {
    formData.set('sectionId', input.sectionId)
  }

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message ?? 'Failed to upload room asset')
  }

  return (await response.json()) as UploadAssetResponse
}

export async function uploadDecorAsset(input: {
  decorCode: string
  assetType: 'thumb' | 'tile512' | 'tile2048'
  file: File
}): Promise<UploadAssetResponse> {
  const formData = new FormData()
  formData.set('decorCode', input.decorCode)
  formData.set('assetType', input.assetType)
  formData.set('file', input.file)

  const response = await fetch('/api/admin/upload-decor', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message ?? 'Failed to upload decor asset')
  }

  return (await response.json()) as UploadAssetResponse
}

export interface DecorPayload {
  code: string
  name: string
  category: string
  thumb: string
  tile512: string
  tile2048: string
  gloss: number
  availability: Record<string, boolean>
  structureDepth?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

async function adminJsonRequest<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function createDecor(payload: DecorPayload): Promise<{ code: string }> {
  return adminJsonRequest<{ code: string }>('/decors', {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export async function updateDecor(code: string, payload: Partial<DecorPayload>): Promise<{ code: string }> {
  return adminJsonRequest<{ code: string }>(`/decors/${code}`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, code }),
    cache: 'no-store',
  })
}

export async function deleteDecor(code: string): Promise<void> {
  await adminJsonRequest<void>(`/decors/${code}`, {
    method: 'DELETE',
    cache: 'no-store',
  })
}

export async function getAdminStats(): Promise<{ roomCount: number; decorCount: number }> {
  const res = await fetch(`${API_BASE}/admin/stats`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch admin stats')
  return (await res.json()) as { roomCount: number; decorCount: number }
}

