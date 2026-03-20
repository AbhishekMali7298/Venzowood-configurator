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
