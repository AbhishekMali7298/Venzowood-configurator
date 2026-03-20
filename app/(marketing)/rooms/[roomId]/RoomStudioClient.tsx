'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { DecorDrawer } from '@/components/decor/DecorDrawer'
import { ComparisonSlider } from '@/components/room/ComparisonSlider'
import { HotspotOverlay } from '@/components/room/HotspotOverlay'
import { RoomCanvas } from '@/components/room/RoomCanvas'
import { SectionLabel } from '@/components/room/SectionLabel'
import type { Decor } from '@/features/decor/types'
import { applyPlaceholderAssets } from '@/features/room-engine/placeholders'
import type { Room } from '@/features/room-engine/types'
import { useCompareMode } from '@/hooks/useCompareMode'
import { useCompositor } from '@/hooks/useCompositor'
import { useProjectPersist } from '@/hooks/useProjectPersist'
import { useStore } from '@/store'
import { downloadCanvasAsPng } from '@/utils/image'

interface RoomStudioClientProps {
  room: Room
  decors: Decor[]
}

function shouldUsePlaceholders(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDERS !== 'false'
}

export function RoomStudioClient({ room, decors }: RoomStudioClientProps) {
  const searchParams = useSearchParams()
  const projectFromQuery = searchParams.get('project')

  const initializedRef = useRef(false)
  const compareInitializedRef = useRef(false)
  const loadedProjectRef = useRef<string | null>(null)
  const primaryCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const source = useMemo(() => {
    if (!shouldUsePlaceholders()) {
      return { room, decors }
    }

    return applyPlaceholderAssets(room, decors)
  }, [decors, room])

  const decorByCode = useMemo(
    () => new Map(source.decors.map((decor) => [decor.code, decor])),
    [source.decors],
  )

  const enrichedRoom = useMemo(
    () => ({
      ...source.room,
      sections: source.room.sections
        .map((section) => ({
          ...section,
          defaultDecor: decorByCode.get(section.defaultDecorCode),
        }))
        .sort((a, b) => a.renderOrder - b.renderOrder),
      furniture: [...(source.room.furniture ?? [])].sort((a, b) => a.zIndex - b.zIndex),
    }),
    [decorByCode, source.room],
  )

  const hotspots = useMemo(
    () =>
      enrichedRoom.sections.map((section) => ({
        id: section.id,
        nx: section.hotspot.nx,
        ny: section.hotspot.ny,
        label: section.label,
        surfaceType: section.surfaceType,
      })),
    [enrichedRoom.sections],
  )

  const activeSection = useStore((state) => state.activeSection)
  const drawerOpen = useStore((state) => state.drawerOpen)
  const projectId = useStore((state) => state.projectId)
  const lastSaved = useStore((state) => state.lastSaved)
  const sectionDecorEntries = useStore((state) => Array.from(state.sectionDecors.entries()))

  const setRoom = useStore((state) => state.setRoom)
  const setCatalogue = useStore((state) => state.setCatalogue)
  const setSectionDecors = useStore((state) => state.setSectionDecors)
  const setActiveSection = useStore((state) => state.setActiveSection)
  const setDrawerOpen = useStore((state) => state.setDrawerOpen)
  const selectDecor = useStore((state) => state.selectDecor)
  const setCompareMode = useStore((state) => state.setCompareMode)
  const setProjectId = useStore((state) => state.setProjectId)
  const markSaved = useStore((state) => state.markSaved)

  const sectionDecors = useMemo(() => new Map(sectionDecorEntries), [sectionDecorEntries])

  const primaryCompositor = useCompositor(enrichedRoom.width, enrichedRoom.height)
  const compareCompositor = useCompositor(enrichedRoom.width, enrichedRoom.height)

  const compareMode = useCompareMode()

  const { saveCurrentProject, loadProjectById } = useProjectPersist({
    room: enrichedRoom,
    sectionDecors,
    decorByCode,
    setSectionDecors,
    setProjectId,
    markSaved,
    country: 'IN',
  })

  const handlePrimaryCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      primaryCanvasRef.current = canvas
      primaryCompositor.attachCanvas(canvas)
    },
    [primaryCompositor],
  )

  const handleCompareCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      compareCompositor.attachCanvas(canvas)
    },
    [compareCompositor],
  )

  useEffect(() => {
    setRoom(enrichedRoom)
    setCatalogue(source.decors)
  }, [enrichedRoom, setCatalogue, setRoom, source.decors])

  useEffect(() => {
    if (!primaryCompositor.isReady) {
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      void primaryCompositor.initRoom(enrichedRoom, sectionDecors)
      return
    }

    void primaryCompositor.render(enrichedRoom, sectionDecors, 'low')
  }, [enrichedRoom, primaryCompositor, sectionDecors])

  useEffect(() => {
    setCompareMode(compareMode.isActive)

    if (!compareMode.isActive) {
      compareInitializedRef.current = false
      return
    }

    if (!compareCompositor.isReady) {
      return
    }

    if (!compareInitializedRef.current) {
      compareInitializedRef.current = true
      void compareCompositor.initRoom(enrichedRoom, compareMode.baselineDecors)
      return
    }

    void compareCompositor.render(enrichedRoom, compareMode.baselineDecors, 'low')
  }, [
    compareCompositor,
    compareMode.baselineDecors,
    compareMode.isActive,
    enrichedRoom,
    setCompareMode,
  ])

  useEffect(() => {
    if (!projectFromQuery) {
      return
    }

    if (loadedProjectRef.current === projectFromQuery) {
      return
    }

    loadedProjectRef.current = projectFromQuery

    void loadProjectById(projectFromQuery).catch(() => {
      loadedProjectRef.current = null
      setSaveState('error')
    })
  }, [loadProjectById, projectFromQuery])

  const handleHotspotSelect = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId)
      setDrawerOpen(true)
    },
    [setActiveSection, setDrawerOpen],
  )

  const handleDecorSelect = useCallback(
    (sectionId: string, decor: Decor) => {
      selectDecor(sectionId, decor)
      const next = new Map(sectionDecors)
      next.set(sectionId, decor)
      void primaryCompositor.renderProgressive(enrichedRoom, next)
    },
    [enrichedRoom, primaryCompositor, sectionDecors, selectDecor],
  )

  const handleToggleCompare = useCallback(() => {
    compareMode.toggle(sectionDecors)
  }, [compareMode, sectionDecors])

  const handleRefreshBaseline = useCallback(() => {
    compareMode.refreshBaseline(sectionDecors)
  }, [compareMode, sectionDecors])

  const handleSaveProject = useCallback(async () => {
    try {
      setSaveState('saving')
      await saveCurrentProject()
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [saveCurrentProject])

  const handleExportPng = useCallback(() => {
    if (!primaryCanvasRef.current) {
      return
    }

    downloadCanvasAsPng(primaryCanvasRef.current, `${enrichedRoom.id}-export.png`)
  }, [enrichedRoom.id])

  const activeDecorCode = activeSection ? sectionDecors.get(activeSection)?.code : undefined

  const compareClip = `${Math.round(compareMode.sliderPosition * 100)}%`

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{enrichedRoom.name}</h1>
          <SectionLabel text="Click a dot to change this surface" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCompare}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
          >
            {compareMode.isActive ? 'Exit Compare' : 'Compare'}
          </button>
          {compareMode.isActive ? (
            <button
              type="button"
              onClick={handleRefreshBaseline}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
            >
              Refresh Baseline
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSaveProject}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
          >
            {saveState === 'saving' ? 'Saving...' : 'Save Project'}
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
          >
            Export PNG
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-stone-600">
        <span>
          Render: {primaryCompositor.isRendering ? 'Rendering...' : 'Ready'}
          {compareMode.isActive
            ? ` · Compare: ${compareCompositor.isRendering ? 'Rendering...' : 'Ready'}`
            : ''}
        </span>
        {projectId ? <span>Project ID: {projectId}</span> : null}
        {lastSaved ? <span>Last saved: {lastSaved.toLocaleString()}</span> : null}
        {saveState === 'error' ? <span>Unable to save/load project.</span> : null}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-900/5">
        <RoomCanvas
          width={enrichedRoom.width}
          height={enrichedRoom.height}
          onReady={handlePrimaryCanvasReady}
        />

        {compareMode.isActive ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${compareClip})` }}
          >
            <RoomCanvas
              width={enrichedRoom.width}
              height={enrichedRoom.height}
              onReady={handleCompareCanvasReady}
              className="h-full w-full border-0 bg-transparent"
            />
          </div>
        ) : null}

        <HotspotOverlay
          hotspots={hotspots}
          canvasWidth={enrichedRoom.width}
          canvasHeight={enrichedRoom.height}
          activeSection={activeSection}
          onSelect={handleHotspotSelect}
        />
      </div>

      {compareMode.isActive ? (
        <div className="mt-4">
          <ComparisonSlider
            position={compareMode.sliderPosition}
            onChange={compareMode.setSliderPosition}
          />
        </div>
      ) : null}

      {drawerOpen && activeSection ? (
        <DecorDrawer
          sectionId={activeSection}
          decors={source.decors}
          activeDecorCode={activeDecorCode}
          onSelect={handleDecorSelect}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </main>
  )
}
