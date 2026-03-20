'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createDecor,
  deleteDecor,
  type DecorPayload,
  updateDecor,
  uploadDecorAsset,
} from '@/services/admin-api'
import { getDecors } from '@/services/decor-api'

type DecorRow = {
  code: string
  name: string
  category: string
  gloss: number
  thumb: string
  tile512: string
  tile2048: string
}

function FileOrUrlField({
  label,
  required,
  currentUrl,
  onFile,
}: {
  label: string
  required?: boolean
  currentUrl?: string
  onFile: (file: File | null) => void
}) {
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
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  )
}

export function DecorAdminClient() {
  // ── List state ─────────────────────────────────────────────────────────────
  const [decors, setDecors] = useState<DecorRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // ── Form state ─────────────────────────────────────────────────────────────
  const [editCode, setEditCode] = useState<string | null>(null) // null = create mode
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [gloss, setGloss] = useState('0.2')
  const [availIN, setAvailIN] = useState(true)
  const [availDE, setAvailDE] = useState(true)

  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [tile512File, setTile512File] = useState<File | null>(null)
  const [tile2048File, setTile2048File] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  })

  // ── Load decors ────────────────────────────────────────────────────────────
  const loadDecors = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await getDecors({ limit: 200 })
      setDecors(
        res.decors.map((d) => ({
          code: d.code,
          name: d.name,
          category: d.category,
          gloss: d.gloss,
          thumb: d.thumb,
          tile512: d.tile512,
          tile2048: d.tile2048,
        })),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDecors()
  }, [loadDecors])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchTerm) return decors
    const q = searchTerm.toLowerCase()
    return decors.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    )
  }, [decors, searchTerm])

  // ── Select row to edit ─────────────────────────────────────────────────────
  const handleEdit = (row: DecorRow) => {
    setEditCode(row.code)
    setCode(row.code)
    setName(row.name)
    setCategory(row.category)
    setGloss(String(row.gloss))
    setThumbFile(null)
    setTile512File(null)
    setTile2048File(null)
    setStatus({ type: 'idle', message: '' })
  }

  const handleNewMode = () => {
    setEditCode(null)
    setCode('')
    setName('')
    setCategory('')
    setGloss('0.2')
    setThumbFile(null)
    setTile512File(null)
    setTile2048File(null)
    setStatus({ type: 'idle', message: '' })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (code: string) => {
    if (!confirm(`Delete decor "${code}"? This cannot be undone.`)) return
    try {
      await deleteDecor(code)
      setDecors((prev) => prev.filter((d) => d.code !== code))
      if (editCode === code) handleNewMode()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus({ type: 'idle', message: '' })

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '_')
    const isCreate = editCode === null

    if (isCreate && (!thumbFile || !tile512File || !tile2048File)) {
      setStatus({ type: 'error', message: 'All 3 image files are required when creating a new decor.' })
      return
    }

    try {
      setIsSubmitting(true)

      // Upload files that were provided
      const [thumbUrl, tile512Url, tile2048Url] = await Promise.all([
        thumbFile
          ? uploadDecorAsset({ decorCode: normalizedCode, assetType: 'thumb', file: thumbFile }).then((r) => r.url)
          : Promise.resolve(decors.find((d) => d.code === editCode)?.thumb ?? ''),
        tile512File
          ? uploadDecorAsset({ decorCode: normalizedCode, assetType: 'tile512', file: tile512File }).then((r) => r.url)
          : Promise.resolve(decors.find((d) => d.code === editCode)?.tile512 ?? ''),
        tile2048File
          ? uploadDecorAsset({ decorCode: normalizedCode, assetType: 'tile2048', file: tile2048File }).then(
              (r) => r.url,
            )
          : Promise.resolve(decors.find((d) => d.code === editCode)?.tile2048 ?? ''),
      ])

      const payload: DecorPayload = {
        code: normalizedCode,
        name: name.trim(),
        category: category.trim().toLowerCase(),
        gloss: parseFloat(gloss) || 0.2,
        thumb: thumbUrl,
        tile512: tile512Url,
        tile2048: tile2048Url,
        availability: { IN: availIN, DE: availDE },
      }

      if (isCreate) {
        await createDecor(payload)
        setDecors((prev) => [{ ...payload }, ...prev])
        setStatus({ type: 'success', message: `Decor "${normalizedCode}" created.` })
        handleNewMode()
      } else {
        await updateDecor(editCode!, payload)
        setDecors((prev) => prev.map((d) => (d.code === editCode ? { ...payload } : d)))
        setStatus({ type: 'success', message: `Decor "${normalizedCode}" updated.` })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Operation failed',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentRow = editCode ? decors.find((d) => d.code === editCode) : null

  return (
    <main className="px-2 py-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Decor Manager</h1>
          <p className="mt-1 text-sm text-stone-600">Create, edit, or delete veneer/decor entries.</p>
        </div>
        <button
          type="button"
          onClick={handleNewMode}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          + New Decor
        </button>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[380px,1fr]">
        {/* ── Decor list ─────────────────────────────────────── */}
        <section className="rounded-xl border border-stone-300 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
            Existing Decors ({decors.length})
          </h2>
          <input
            type="text"
            placeholder="Search code, name, category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-3 w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-600"
          />
          <div className="mt-3 max-h-[70vh] overflow-auto pr-1">
            {isLoading ? (
              <p className="text-sm text-stone-500">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-stone-500">No decors found.</p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((row) => (
                  <li
                    key={row.code}
                    className={`flex items-center gap-2 rounded border px-3 py-2 ${
                      editCode === row.code
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    {/* Thumb preview */}
                    {row.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.thumb}
                        alt={row.name}
                        className="h-10 w-10 flex-none rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 flex-none rounded bg-stone-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{row.name}</p>
                      <p className="truncate text-xs text-stone-500">
                        {row.code} · {row.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:border-stone-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row.code)}
                        className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                      >
                        Del
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Create / Edit form ─────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-stone-300 bg-white p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-stone-900">
              {editCode ? `Editing: ${editCode}` : 'New Decor'}
            </h2>
            {editCode ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Edit Mode
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Create Mode
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Code *</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="H1145_ST10"
                disabled={editCode !== null}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700 disabled:bg-stone-100 disabled:text-stone-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sand Beige Whiteriver Oak"
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Category *</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="wood"
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Gloss (0–1)</span>
              <input
                type="number"
                value={gloss}
                onChange={(e) => setGloss(e.target.value)}
                min="0"
                max="1"
                step="0.05"
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-700"
              />
            </label>

            <div className="flex gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={availIN} onChange={(e) => setAvailIN(e.target.checked)} />
                Available IN (India)
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={availDE} onChange={(e) => setAvailDE(e.target.checked)} />
                Available DE (Germany)
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FileOrUrlField
              label="Thumbnail"
              required={editCode === null}
              currentUrl={currentRow?.thumb}
              onFile={setThumbFile}
            />
            <FileOrUrlField
              label="Tile 512px"
              required={editCode === null}
              currentUrl={currentRow?.tile512}
              onFile={setTile512File}
            />
            <FileOrUrlField
              label="Tile 2048px"
              required={editCode === null}
              currentUrl={currentRow?.tile2048}
              onFile={setTile2048File}
            />
          </div>

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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSubmitting ? 'Saving…' : editCode ? 'Update Decor' : 'Create Decor'}
            </button>
            {editCode ? (
              <button
                type="button"
                onClick={handleNewMode}
                className="rounded border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-stone-500"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
