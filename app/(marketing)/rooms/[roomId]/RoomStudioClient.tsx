'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

import { DecorDrawer } from '@/components/decor/DecorDrawer'
import { HotspotOverlay } from '@/components/room/HotspotOverlay'
import { RoomCanvas } from '@/components/room/RoomCanvas'
import { SectionLabel } from '@/components/room/SectionLabel'
import type { Decor } from '@/features/decor/types'
import { applyPlaceholderAssets } from '@/features/room-engine/placeholders'
import type { Room } from '@/features/room-engine/types'
import { useCompositor } from '@/hooks/useCompositor'
import { useStore } from '@/store'

interface RoomStudioClientProps {
  room: Room
  decors: Decor[]
}

function shouldUsePlaceholders(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLACEHOLDERS !== 'false'
}

export function RoomStudioClient({ room, decors }: RoomStudioClientProps) {
  const initializedRef = useRef(false)

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
  const sectionDecorEntries = useStore((state) => Array.from(state.sectionDecors.entries()))
  const setRoom = useStore((state) => state.setRoom)
  const setCatalogue = useStore((state) => state.setCatalogue)
  const setActiveSection = useStore((state) => state.setActiveSection)
  const setDrawerOpen = useStore((state) => state.setDrawerOpen)
  const selectDecor = useStore((state) => state.selectDecor)

  const sectionDecors = useMemo(() => new Map(sectionDecorEntries), [sectionDecorEntries])

  const { attachCanvas, isReady, isRendering, initRoom, render, renderProgressive } = useCompositor(
    enrichedRoom.width,
    enrichedRoom.height,
  )

  useEffect(() => {
    setRoom(enrichedRoom)
    setCatalogue(source.decors)
  }, [enrichedRoom, setCatalogue, setRoom, source.decors])

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      void initRoom(enrichedRoom, sectionDecors)
      return
    }

    void render(enrichedRoom, sectionDecors, 'low')
  }, [enrichedRoom, initRoom, isReady, render, sectionDecors])

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
      void renderProgressive(enrichedRoom, next)
    },
    [enrichedRoom, renderProgressive, sectionDecors, selectDecor],
  )

  const activeDecorCode = activeSection ? sectionDecors.get(activeSection)?.code : undefined

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{enrichedRoom.name}</h1>
          <SectionLabel text="Click a dot to change this surface" />
        </div>
        <span className="text-sm text-stone-600">{isRendering ? 'Rendering...' : 'Ready'}</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-900/5">
        <RoomCanvas
          width={enrichedRoom.width}
          height={enrichedRoom.height}
          onReady={attachCanvas}
        />
        <HotspotOverlay
          hotspots={hotspots}
          canvasWidth={enrichedRoom.width}
          canvasHeight={enrichedRoom.height}
          activeSection={activeSection}
          onSelect={handleHotspotSelect}
        />
      </div>

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
