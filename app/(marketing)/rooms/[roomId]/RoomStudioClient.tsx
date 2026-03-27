'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DecorDrawer } from '@/components/decor/DecorDrawer'
import { ComparisonSlider } from '@/components/room/ComparisonSlider'
import { HotspotOverlay } from '@/components/room/HotspotOverlay'
import { RoomViewer } from '@/components/room/RoomViewer'
import { SectionLabel } from '@/components/room/SectionLabel'
import { Spinner } from '@/components/ui/Spinner'
import { StudioStatus } from '@/components/room/StudioStatus'
import { StudioToolbar } from '@/components/room/StudioToolbar'
import type { Decor } from '@/features/decor/types'
import { buildEggerRenderUrl } from '@/features/room-engine/egger-proxy'
import { applyPlaceholderAssets } from '@/features/room-engine/placeholders'
import type { Room } from '@/features/room-engine/types'
import { useCompareMode } from '@/hooks/useCompareMode'
import { useProjectPersist } from '@/hooks/useProjectPersist'
import { useStore } from '@/store'

interface RoomStudioClientProps {
  room: Room
  decors: Decor[]
  projectFromQuery?: string | null
}

function shouldUsePlaceholders(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDERS === 'true'
}

function shouldUseEggerProxy(): boolean {
  return process.env.NEXT_PUBLIC_USE_EGGER_PROXY === 'true'
}

function isKnownUnreachableDevCdn(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'cdn.decorviz.com'
  } catch {
    return false
  }
}

export function RoomStudioClient({ room, decors, projectFromQuery = null }: RoomStudioClientProps) {
  const loadedProjectRef = useRef<string | null>(null)

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const shouldAutoFallback = useMemo(() => {
    const roomHasCdnAssets =
      isKnownUnreachableDevCdn(room.layers.base) ||
      isKnownUnreachableDevCdn(room.layers.shadow) ||
      Boolean(room.layers.reflection && isKnownUnreachableDevCdn(room.layers.reflection)) ||
      room.sections.some((section) => isKnownUnreachableDevCdn(section.uvMask))
    return roomHasCdnAssets
  }, [room.layers.base, room.layers.reflection, room.layers.shadow, room.sections])

  const source = useMemo(() => {
    if (!shouldUsePlaceholders() && !shouldAutoFallback) {
      return { room, decors }
    }

    return applyPlaceholderAssets(room, decors)
  }, [decors, room, shouldAutoFallback])

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
  const compareModeInStore = useStore((state) => state.compareMode)
  const projectId = useStore((state) => state.projectId)
  const lastSaved = useStore((state) => state.lastSaved)
  const sectionDecors = useStore((state) => state.sectionDecors)

  const setRoom = useStore((state) => state.setRoom)
  const setCatalogue = useStore((state) => state.setCatalogue)
  const setSectionDecors = useStore((state) => state.setSectionDecors)
  const setActiveSection = useStore((state) => state.setActiveSection)
  const setDrawerOpen = useStore((state) => state.setDrawerOpen)
  const selectDecor = useStore((state) => state.selectDecor)
  const resetSection = useStore((state) => state.resetSection)
  const resetAll = useStore((state) => state.resetAll)
  const setCompareMode = useStore((state) => state.setCompareMode)
  const setProjectId = useStore((state) => state.setProjectId)
  const markSaved = useStore((state) => state.markSaved)

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

  const activeRoomInStore = useStore((state) => state.activeRoom)

  useEffect(() => {
    // If we're entering a different room than the one stored in the session,
    // clear the previous room's selections to avoid visual glitches.
    if (activeRoomInStore && activeRoomInStore.id !== enrichedRoom.id) {
      resetAll()
    }
    
    setRoom(enrichedRoom)
    setCatalogue(source.decors)
  }, [enrichedRoom, setCatalogue, setRoom, source.decors, activeRoomInStore, resetAll])

  useEffect(() => {
    if (compareModeInStore !== compareMode.isActive) {
      setCompareMode(compareMode.isActive)
    }
  }, [compareMode.isActive, compareModeInStore, setCompareMode])

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
      // Rendering will happen automatically via React state update in RoomViewer
    },
    [selectDecor],
  )

  const handleToggleCompare = useCallback(() => {
    compareMode.toggle(sectionDecors)
  }, [compareMode, sectionDecors])

  const handleRefreshBaseline = useCallback(() => {
    compareMode.refreshBaseline(sectionDecors)
  }, [compareMode, sectionDecors])

  const handleResetSection = useCallback(() => {
    if (!activeSection || !sectionDecors.has(activeSection)) {
      return
    }
    resetSection(activeSection)
  }, [activeSection, resetSection, sectionDecors])

  const handleResetAll = useCallback(() => {
    if (sectionDecors.size === 0) {
      return
    }
    resetAll()
  }, [resetAll, sectionDecors.size])

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
    alert('Export is temporarily disabled during DOM migration. Standard Canvas export logic needs updating for DOM layering.')
    // In a real project, we would use html2canvas or a similar client-side library to capture the layered DOM.
  }, [])

  const activeSectionConfig = useMemo(
    () => enrichedRoom.sections.find((section) => section.id === activeSection) ?? null,
    [activeSection, enrichedRoom.sections],
  )
  const activeDecorCode = activeSection ? sectionDecors.get(activeSection)?.code : undefined
  const compareClip = `${Math.round(compareMode.sliderPosition * 100)}%`
  const canResetSection = Boolean(activeSection && sectionDecors.has(activeSection))
  const hasSelections = sectionDecors.size > 0

  const useEggerProxy = shouldUseEggerProxy()
  const eggerRenderUrl = useMemo(() => {
    if (!useEggerProxy) return null
    return buildEggerRenderUrl(enrichedRoom.id, sectionDecors, enrichedRoom.width, enrichedRoom.height)
  }, [enrichedRoom.id, enrichedRoom.height, enrichedRoom.width, sectionDecors, useEggerProxy])

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <div className="mb-4">
        <StudioToolbar
          roomName={enrichedRoom.name}
          compareActive={compareMode.isActive}
          canResetSection={canResetSection}
          hasSelections={hasSelections}
          saveState={saveState}
          onToggleCompare={handleToggleCompare}
          onRefreshBaseline={handleRefreshBaseline}
          onResetSection={handleResetSection}
          onResetAll={handleResetAll}
          onSaveProject={handleSaveProject}
          onExportPng={handleExportPng}
        />
        <div className="mt-4">
          <SectionLabel text="Click a dot to change this surface" />
        </div>
      </div>

      <StudioStatus
        renderReady={true}
        compareActive={compareMode.isActive}
        compareReady={true}
        projectId={projectId}
        lastSaved={lastSaved}
        saveState={saveState}
      />

      <div className="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-900/5">
        <RoomViewer
          room={enrichedRoom}
          sectionDecors={sectionDecors}
          quality="low"
        />

        {useEggerProxy && eggerRenderUrl && hasSelections ? (
          <img
            src={eggerRenderUrl}
            alt="Egger Proxy Render"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {compareMode.isActive ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${compareClip})` }}
          >
            <RoomViewer
              room={enrichedRoom}
              sectionDecors={compareMode.baselineDecors}
              quality="low"
              className="h-full w-full border-0 bg-transparent"
            />
          </div>
        ) : null}

        <div className="absolute inset-0 z-20">
          <HotspotOverlay
            hotspots={hotspots}
            canvasWidth={enrichedRoom.width}
            canvasHeight={enrichedRoom.height}
            activeSection={activeSection}
            onSelect={handleHotspotSelect}
          />
        </div>
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
          sectionLabel={activeSectionConfig?.label}
          compatibleCategories={activeSectionConfig?.compatibleCategories}
          decors={source.decors}
          activeDecorCode={activeDecorCode}
          onSelect={handleDecorSelect}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </main>
  )
}
