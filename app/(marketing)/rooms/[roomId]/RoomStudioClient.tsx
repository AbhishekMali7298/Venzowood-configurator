'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DecorDrawer } from '@/components/decor/DecorDrawer'
import { ComparisonSlider } from '@/components/room/ComparisonSlider'
import { HotspotOverlay } from '@/components/room/HotspotOverlay'
import { RoomCanvas } from '@/components/room/RoomCanvas'
import { SectionLabel } from '@/components/room/SectionLabel'
import { Spinner } from '@/components/ui/Spinner'
import { StudioStatus } from '@/components/room/StudioStatus'
import { StudioToolbar } from '@/components/room/StudioToolbar'
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
  projectFromQuery?: string | null
}

function shouldUsePlaceholders(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDERS !== 'false'
}

export function RoomStudioClient({ room, decors, projectFromQuery = null }: RoomStudioClientProps) {
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

  const {
    attachCanvas: attachPrimaryCanvas,
    isReady: isPrimaryReady,
    isRendering: isPrimaryRendering,
    initRoom: initPrimaryRoom,
    render: renderPrimary,
    renderProgressive: renderPrimaryProgressive,
  } = useCompositor(enrichedRoom.width, enrichedRoom.height)
  const {
    attachCanvas: attachCompareCanvas,
    isReady: isCompareReady,
    isRendering: isCompareRendering,
    initRoom: initCompareRoom,
    render: renderCompare,
  } = useCompositor(enrichedRoom.width, enrichedRoom.height)

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
      attachPrimaryCanvas(canvas)
    },
    [attachPrimaryCanvas],
  )

  const handleCompareCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      attachCompareCanvas(canvas)
    },
    [attachCompareCanvas],
  )

  useEffect(() => {
    setRoom(enrichedRoom)
    setCatalogue(source.decors)
  }, [enrichedRoom, setCatalogue, setRoom, source.decors])

  useEffect(() => {
    if (!isPrimaryReady) {
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      void initPrimaryRoom(enrichedRoom, sectionDecors)
      return
    }

    void renderPrimary(enrichedRoom, sectionDecors, 'low')
  }, [enrichedRoom, initPrimaryRoom, isPrimaryReady, renderPrimary, sectionDecors])

  useEffect(() => {
    setCompareMode(compareMode.isActive)

    if (!compareMode.isActive) {
      compareInitializedRef.current = false
      return
    }

    if (!isCompareReady) {
      return
    }

    if (!compareInitializedRef.current) {
      compareInitializedRef.current = true
      void initCompareRoom(enrichedRoom, compareMode.baselineDecors)
      return
    }

    void renderCompare(enrichedRoom, compareMode.baselineDecors, 'low')
  }, [
    compareMode.baselineDecors,
    compareMode.isActive,
    enrichedRoom,
    initCompareRoom,
    isCompareReady,
    renderCompare,
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
      void renderPrimaryProgressive(enrichedRoom, next)
    },
    [enrichedRoom, renderPrimaryProgressive, sectionDecors, selectDecor],
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
  const showCanvasLoading = !isPrimaryReady || (isPrimaryRendering && !initializedRef.current)

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{enrichedRoom.name}</h1>
          <SectionLabel text="Click a dot to change this surface" />
        </div>
        <StudioToolbar
          compareActive={compareMode.isActive}
          saveState={saveState}
          onToggleCompare={handleToggleCompare}
          onRefreshBaseline={handleRefreshBaseline}
          onSaveProject={handleSaveProject}
          onExportPng={handleExportPng}
        />
      </div>

      <StudioStatus
        renderReady={!isPrimaryRendering}
        compareActive={compareMode.isActive}
        compareReady={!isCompareRendering}
        projectId={projectId}
        lastSaved={lastSaved}
        saveState={saveState}
      />

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

        {showCanvasLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-200/60 backdrop-blur-[1px]">
            <Spinner />
          </div>
        ) : null}
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
