import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  decorCode: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),
  assetType: z.enum(['thumb', 'tile512', 'tile2048']),
})

function normalizeExtension(fileName: string): string {
  const extension = path.extname(fileName).replace('.', '').toLowerCase()
  if (!extension || !/^[a-z0-9]{2,5}$/.test(extension)) {
    return 'webp'
  }
  return extension
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const rawDecorCode = formData.get('decorCode')
    const rawAssetType = formData.get('assetType')
    const rawFile = formData.get('file')

    const payload = bodySchema.parse({
      decorCode: typeof rawDecorCode === 'string' ? rawDecorCode : '',
      assetType: typeof rawAssetType === 'string' ? rawAssetType : '',
    })

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ message: 'Missing file' }, { status: 400 })
    }

    const extension = normalizeExtension(rawFile.name)
    const relativePath = `/static/decors/${payload.decorCode}/${payload.assetType}.${extension}`
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

    return NextResponse.json({ message: 'Failed to upload decor file' }, { status: 500 })
  }
}
