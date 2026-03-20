import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  roomId: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  assetType: z.enum(['thumb', 'base', 'shadow', 'reflection', 'uvMask']),
  sectionId: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
})

function normalizeExtension(fileName: string): string {
  const extension = path.extname(fileName).replace('.', '').toLowerCase()
  if (!extension || !/^[a-z0-9]{2,5}$/.test(extension)) {
    return 'webp'
  }
  return extension
}

function resolveRelativePath(input: {
  roomId: string
  assetType: 'thumb' | 'base' | 'shadow' | 'reflection' | 'uvMask'
  extension: string
  sectionId?: string
}): string {
  const ext = input.extension

  if (input.assetType === 'thumb') {
    return `/static/rooms/${input.roomId}/thumb.${ext}`
  }

  if (input.assetType === 'uvMask') {
    if (!input.sectionId) {
      throw new Error('sectionId is required for uvMask')
    }

    return `/static/rooms/${input.roomId}/sections/${input.sectionId}/uv-mask.${ext}`
  }

  return `/static/rooms/${input.roomId}/layers/${input.assetType}.${ext}`
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const rawRoomId = formData.get('roomId')
    const rawAssetType = formData.get('assetType')
    const rawSectionId = formData.get('sectionId')
    const rawFile = formData.get('file')

    const payload = bodySchema.parse({
      roomId: typeof rawRoomId === 'string' ? rawRoomId : '',
      assetType: typeof rawAssetType === 'string' ? rawAssetType : '',
      sectionId: typeof rawSectionId === 'string' ? rawSectionId : undefined,
    })

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 })
    }

    const extension = normalizeExtension(rawFile.name)
    const relativePath = resolveRelativePath({
      roomId: payload.roomId,
      assetType: payload.assetType,
      sectionId: payload.sectionId,
      extension,
    })
    const outputPath = path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''))

    await mkdir(path.dirname(outputPath), { recursive: true })

    const bytes = await rawFile.arrayBuffer()
    await writeFile(outputPath, Buffer.from(bytes))

    return NextResponse.json({ url: relativePath })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues.map((issue) => issue.message).join('; ') },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 })
  }
}
