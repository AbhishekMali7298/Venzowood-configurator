'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { uploadRoomAsset } from '@/services/admin-api'
import { createRoom, getRooms } from '@/services/room-api'

type RoomCategory = 'private' | 'public'

interface FileFieldProps {
  label: string
  required?: boolean
  onChange: (file: File | null) => void
}

function FileField({ label, required = false, onChange }: FileFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-800">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type="file"
        accept="image/*"
        className="block w-full cursor-pointer rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          onChange(file)
        }}
      />
    </label>
  )
}

export function RoomAdminClient() {
  const [roomId, setRoomId] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<RoomCategory>('private')
  const [width, setWidth] = useState('1920')
  const [height, setHeight] = useState('1080')
  const [availableInDE, setAvailableInDE] = useState(true)

  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [shadowFile, setShadowFile] = useState<File | null>(null)
  const [reflectionFile, setReflectionFile] = useState<File | null>(null)
  const [wallMaskFile, setWallMaskFile] = useState<File | null>(null)
  const [floorMaskFile, setFloorMaskFile] = useState<File | null>(null)
  const [countertopMaskFile, setCountertopMaskFile] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [existingRooms, setExistingRooms] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  })

  useEffect(() => {
    let ignore = false

    const loadRooms = async () => {
      try {
        setIsLoadingRooms(true)
        const response = await getRooms()
        if (!ignore) {
          setExistingRooms(
            response.rooms.map((room) => ({
              id: room.id,
              name: room.name,
              category: room.category,
            })),
          )
        }
      } finally {
        if (!ignore) {
          setIsLoadingRooms(false)
        }
      }
    }

    void loadRooms()
    return () => {
      ignore = true
    }
  }, [])

  const canSubmit = useMemo(
    () =>
      Boolean(
        roomId &&
          name &&
          width &&
          height &&
          thumbFile &&
          baseFile &&
          shadowFile &&
          wallMaskFile &&
          floorMaskFile &&
          countertopMaskFile,
      ),
    [baseFile, countertopMaskFile, floorMaskFile, height, name, roomId, shadowFile, thumbFile, wallMaskFile, width],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus({ type: 'idle', message: '' })

    if (!canSubmit) {
      setStatus({ type: 'error', message: 'Fill all required fields and select all required files.' })
      return
    }

    try {
      setIsSubmitting(true)

      const normalizedRoomId = roomId.trim().toLowerCase()

      const [thumb, base, shadow, wallMask, floorMask, countertopMask] = await Promise.all([
        uploadRoomAsset({ roomId: normalizedRoomId, assetType: 'thumb', file: thumbFile as File }),
        uploadRoomAsset({ roomId: normalizedRoomId, assetType: 'base', file: baseFile as File }),
        uploadRoomAsset({ roomId: normalizedRoomId, assetType: 'shadow', file: shadowFile as File }),
        uploadRoomAsset({
          roomId: normalizedRoomId,
          assetType: 'uvMask',
          sectionId: 'wall-main',
          file: wallMaskFile as File,
        }),
        uploadRoomAsset({
          roomId: normalizedRoomId,
          assetType: 'uvMask',
          sectionId: 'floor',
          file: floorMaskFile as File,
        }),
        uploadRoomAsset({
          roomId: normalizedRoomId,
          assetType: 'uvMask',
          sectionId: 'countertop',
          file: countertopMaskFile as File,
        }),
      ])

      const reflection = reflectionFile
        ? await uploadRoomAsset({
            roomId: normalizedRoomId,
            assetType: 'reflection',
            file: reflectionFile,
          })
        : null

      const payload = {
        id: normalizedRoomId,
        name: name.trim(),
        category,
        width: Number(width),
        height: Number(height),
        thumb: thumb.url,
        layers: {
          base: base.url,
          shadow: shadow.url,
          reflection: reflection?.url,
        },
        sections: [
          {
            id: 'wall-main',
            label: 'Main wall',
            surfaceType: 'wall' as const,
            hotspot: { nx: 0.42, ny: 0.3 },
            uvMask: wallMask.url,
            tileScale: 0.08,
            defaultDecorCode: 'H1145_ST10',
            compatibleCategories: ['wood', 'stone', 'uni'],
            renderOrder: 1,
          },
          {
            id: 'floor',
            label: 'Floor',
            surfaceType: 'floor' as const,
            hotspot: { nx: 0.5, ny: 0.78 },
            uvMask: floorMask.url,
            tileScale: 0.06,
            defaultDecorCode: 'H3309_ST28',
            compatibleCategories: ['wood', 'stone'],
            renderOrder: 2,
          },
          {
            id: 'countertop',
            label: 'Countertop',
            surfaceType: 'countertop' as const,
            hotspot: { nx: 0.66, ny: 0.56 },
            uvMask: countertopMask.url,
            tileScale: 0.09,
            defaultDecorCode: 'F274_ST9',
            compatibleCategories: ['stone', 'uni'],
            renderOrder: 3,
          },
        ],
        furniture: [],
        availability: {
          IN: true,
          DE: availableInDE,
        },
      }

      const result = await createRoom(payload)
      setExistingRooms((current) => {
        const withoutSameId = current.filter((room) => room.id !== result.id)
        return [{ id: result.id, name: payload.name, category: payload.category }, ...withoutSameId]
      })

      setStatus({
        type: 'success',
        message: `Room saved (${result.id}). Open /rooms/${result.id} to verify.`,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create room',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="px-2 py-1">
      <h1 className="text-2xl font-semibold text-stone-900">Room Manager</h1>
      <p className="mt-2 text-sm text-stone-600">
        Upload room assets and save room metadata to MongoDB in one step.
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-[320px,1fr]">
        <section className="rounded-xl border border-stone-300 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Existing Rooms</h2>
          <div className="mt-3 max-h-[70vh] overflow-auto pr-1">
            {isLoadingRooms ? (
              <p className="text-sm text-stone-500">Loading rooms...</p>
            ) : existingRooms.length === 0 ? (
              <p className="text-sm text-stone-500">No rooms found.</p>
            ) : (
              <ul className="space-y-2">
                {existingRooms.map((room) => (
                  <li key={room.id} className="rounded border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-sm font-medium text-stone-900">{room.name}</p>
                    <p className="text-xs text-stone-500">
                      {room.id} · {room.category}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-stone-300 bg-white p-6">
          <section className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-800">Room ID *</span>
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="living-room-11"
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-800">Room Name *</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contemporary Living Space"
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-800">Category *</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as RoomCategory)}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
            >
              <option value="private">private</option>
              <option value="public">public</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Width *</span>
              <input
                type="number"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Height *</span>
              <input
                type="number"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={availableInDE}
              onChange={(event) => setAvailableInDE(event.target.checked)}
            />
            Available in DE
          </label>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <FileField label="Thumbnail" required onChange={setThumbFile} />
            <FileField label="Base layer" required onChange={setBaseFile} />
            <FileField label="Shadow layer" required onChange={setShadowFile} />
            <FileField label="Reflection layer (optional)" onChange={setReflectionFile} />
            <FileField label="UV mask: wall-main" required onChange={setWallMaskFile} />
            <FileField label="UV mask: floor" required onChange={setFloorMaskFile} />
            <FileField label="UV mask: countertop" required onChange={setCountertopMaskFile} />
          </section>

          {status.type !== 'idle' ? (
            <div
              className={`rounded border px-3 py-2 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-rose-300 bg-rose-50 text-rose-700'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSubmitting ? 'Uploading + Saving...' : 'Create Room'}
            </button>
            <p className="text-xs text-stone-500">
              Required assets: thumb, base, shadow, and 3 UV masks.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
