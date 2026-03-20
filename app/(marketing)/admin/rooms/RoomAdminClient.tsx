'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { uploadRoomAsset } from '@/services/admin-api'
import { createRoom, deleteRoom, getRooms, updateRoom } from '@/services/room-api'

type RoomCategory = 'private' | 'public'

interface RoomRow {
  id: string
  name: string
  category: string
  thumb: string
  sectionCount: number
}

interface FileFieldProps {
  label: string
  required?: boolean
  currentUrl?: string
  onChange: (file: File | null) => void
}

function FileField({ label, required = false, currentUrl, onChange }: FileFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-800">
        {label}
        {required ? ' *' : ''}
      </span>
      {currentUrl ? (
        <p className="mb-1 truncate text-xs text-stone-500">Current: {currentUrl}</p>
      ) : null}
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
  // ── List state ─────────────────────────────────────────────────────────────
  const [existingRooms, setExistingRooms] = useState<RoomRow[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null) // null = create mode
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
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  })

  // ── Load rooms ─────────────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true)
      const response = await getRooms()
      setExistingRooms(
        response.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          category: room.category,
          thumb: room.thumb,
          sectionCount: room.sectionCount,
        })),
      )
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  // ── Select room to edit ────────────────────────────────────────────────────
  const handleEdit = (row: RoomRow) => {
    setEditId(row.id)
    setRoomId(row.id)
    setName(row.name)
    setCategory(row.category as RoomCategory)
    setThumbFile(null)
    setBaseFile(null)
    setShadowFile(null)
    setReflectionFile(null)
    setWallMaskFile(null)
    setFloorMaskFile(null)
    setCountertopMaskFile(null)
    setStatus({ type: 'idle', message: '' })
  }

  const handleNewMode = () => {
    setEditId(null)
    setRoomId('')
    setName('')
    setCategory('private')
    setWidth('1920')
    setHeight('1080')
    setAvailableInDE(true)
    setThumbFile(null)
    setBaseFile(null)
    setShadowFile(null)
    setReflectionFile(null)
    setWallMaskFile(null)
    setFloorMaskFile(null)
    setCountertopMaskFile(null)
    setStatus({ type: 'idle', message: '' })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm(`Delete room "${id}"? This cannot be undone.`)) return
    try {
      await deleteRoom(id)
      setExistingRooms((prev) => prev.filter((r) => r.id !== id))
      if (editId === id) handleNewMode()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete room')
    }
  }

  const currentRow = editId ? existingRooms.find((r) => r.id === editId) : null
  const isCreate = editId === null

  const canSubmit = useMemo(
    () =>
      Boolean(
        roomId &&
          name &&
          width &&
          height &&
          // On create, all files required. On edit, files are optional.
          (isCreate
            ? thumbFile && baseFile && shadowFile && wallMaskFile && floorMaskFile && countertopMaskFile
            : true),
      ),
    [
      baseFile,
      countertopMaskFile,
      floorMaskFile,
      height,
      isCreate,
      name,
      roomId,
      shadowFile,
      thumbFile,
      wallMaskFile,
      width,
    ],
  )

  // ── Upload helpers ─────────────────────────────────────────────────────────
  const uploadOrKeep = async (
    file: File | null,
    fallbackUrl: string,
    assetType: Parameters<typeof uploadRoomAsset>[0]['assetType'],
    id: string,
    sectionId?: string,
  ): Promise<string> => {
    if (file) {
      const result = await uploadRoomAsset({ roomId: id, assetType, file, sectionId })
      return result.url
    }
    return fallbackUrl
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus({ type: 'idle', message: '' })

    if (!canSubmit) {
      setStatus({ type: 'error', message: 'Fill all required fields and select required files.' })
      return
    }

    try {
      setIsSubmitting(true)

      const normalizedRoomId = roomId.trim().toLowerCase()

      // For create, upload everything. For edit, keep existing URL if no new file.
      const [thumb, base, shadow, wallMask, floorMask, countertopMask] = await Promise.all([
        uploadOrKeep(thumbFile, currentRow?.thumb ?? '', 'thumb', normalizedRoomId),
        uploadOrKeep(baseFile, '', 'base', normalizedRoomId),
        uploadOrKeep(shadowFile, '', 'shadow', normalizedRoomId),
        uploadOrKeep(wallMaskFile, '', 'uvMask', normalizedRoomId, 'wall-main'),
        uploadOrKeep(floorMaskFile, '', 'uvMask', normalizedRoomId, 'floor'),
        uploadOrKeep(countertopMaskFile, '', 'uvMask', normalizedRoomId, 'countertop'),
      ])

      const reflection = reflectionFile
        ? await uploadRoomAsset({ roomId: normalizedRoomId, assetType: 'reflection', file: reflectionFile })
        : null

      const payload = {
        id: normalizedRoomId,
        name: name.trim(),
        category,
        width: Number(width),
        height: Number(height),
        thumb,
        layers: {
          base,
          shadow,
          ...(reflection ? { reflection: reflection.url } : {}),
        },
        sections: [
          {
            id: 'wall-main',
            label: 'Main wall',
            surfaceType: 'wall' as const,
            hotspot: { nx: 0.42, ny: 0.3 },
            uvMask: wallMask,
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
            uvMask: floorMask,
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
            uvMask: countertopMask,
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

      if (isCreate) {
        const result = await createRoom(payload)
        setExistingRooms((current) => {
          const withoutSameId = current.filter((room) => room.id !== result.id)
          return [
            { id: result.id, name: payload.name, category: payload.category, thumb: payload.thumb, sectionCount: payload.sections.length },
            ...withoutSameId,
          ]
        })
        setStatus({
          type: 'success',
          message: `Room created (${result.id}). Open /rooms/${result.id} to verify.`,
        })
        handleNewMode()
      } else {
        await updateRoom(editId!, payload)
        setExistingRooms((current) =>
          current.map((r) =>
            r.id === editId
              ? { ...r, name: payload.name, category: payload.category, thumb: payload.thumb }
              : r,
          ),
        )
        setStatus({
          type: 'success',
          message: `Room "${editId}" updated successfully.`,
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save room',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="px-2 py-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Room Manager</h1>
          <p className="mt-1 text-sm text-stone-600">
            Upload room assets and save room metadata to MongoDB in one step.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewMode}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          + New Room
        </button>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[320px,1fr]">
        {/* ── Existing rooms list ────────────────────────────── */}
        <section className="rounded-xl border border-stone-300 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
            Existing Rooms ({existingRooms.length})
          </h2>
          <div className="mt-3 max-h-[70vh] overflow-auto pr-1">
            {isLoadingRooms ? (
              <p className="text-sm text-stone-500">Loading rooms…</p>
            ) : existingRooms.length === 0 ? (
              <p className="text-sm text-stone-500">No rooms found.</p>
            ) : (
              <ul className="space-y-2">
                {existingRooms.map((room) => (
                  <li
                    key={room.id}
                    className={`rounded border px-3 py-2 ${
                      editId === room.id ? 'border-rose-400 bg-rose-50' : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">{room.name}</p>
                        <p className="text-xs text-stone-500">
                          {room.id} · {room.category} · {room.sectionCount} surfaces
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(room)}
                          className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:border-stone-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(room.id)}
                          className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Form ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-stone-300 bg-white p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-stone-900">
              {editId ? `Editing: ${editId}` : 'New Room'}
            </h2>
            {editId ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Edit Mode
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Create Mode
              </span>
            )}
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Room ID *</span>
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                placeholder="living-room-11"
                disabled={editId !== null}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700 disabled:bg-stone-100 disabled:text-stone-500"
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
            <FileField label="Thumbnail" required={isCreate} currentUrl={currentRow?.thumb} onChange={setThumbFile} />
            <FileField label="Base layer" required={isCreate} onChange={setBaseFile} />
            <FileField label="Shadow layer" required={isCreate} onChange={setShadowFile} />
            <FileField label="Reflection layer (optional)" onChange={setReflectionFile} />
            <FileField label="UV mask: wall-main" required={isCreate} onChange={setWallMaskFile} />
            <FileField label="UV mask: floor" required={isCreate} onChange={setFloorMaskFile} />
            <FileField label="UV mask: countertop" required={isCreate} onChange={setCountertopMaskFile} />
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
              {isSubmitting ? 'Uploading + Saving…' : isCreate ? 'Create Room' : 'Update Room'}
            </button>
            {editId ? (
              <button
                type="button"
                onClick={handleNewMode}
                className="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500"
              >
                Cancel
              </button>
            ) : null}
            <p className="text-xs text-stone-500">
              {isCreate ? 'Required assets: thumb, base, shadow, and 3 UV masks.' : 'Only upload files you wish to replace.'}
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
