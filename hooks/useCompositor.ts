'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Decor } from '@/features/decor/types'
import { preloadDecorTiles } from '@/features/decor/tile-loader'
import { RoomCompositor } from '@/features/room-engine/compositor'
import { CompositorWorkerClient } from '@/features/room-engine/compositor-worker-client'
import type { Room } from '@/features/room-engine/types'

async function preloadImage(url: string): Promise<void> {
  const image = new Image()
  image.src = url
  await image.decode()
}

function canUseWorkerCompositor(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
}

export function useCompositor(width: number, height: number) {
  const compositorRef = useRef<RoomCompositor | null>(null)
  const workerRef = useRef<CompositorWorkerClient | null>(null)

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isRendering, setIsRendering] = useState(false)

  const attachCanvas = useCallback((node: HTMLCanvasElement) => {
    setCanvas((current) => (current === node ? current : node))
  }, [])

  useEffect(() => {
    if (!canvas) {
      return
    }

    if (canUseWorkerCompositor()) {
      workerRef.current = new CompositorWorkerClient()
    }

    compositorRef.current = new RoomCompositor({
      canvas,
      width,
      height,
      workerClient: workerRef.current,
    })

    setIsReady(true)

    return () => {
      compositorRef.current?.clearCache()
      compositorRef.current = null
      workerRef.current?.terminate()
      workerRef.current = null
      setIsReady(false)
    }
  }, [canvas, height, width])

  const render = useCallback(
    async (room: Room, sectionDecors: Map<string, Decor>, quality: 'low' | 'high' = 'low') => {
      const compositor = compositorRef.current
      if (!compositor) {
        return
      }

      setIsRendering(true)
      try {
        await compositor.render({ room, sectionDecors, quality })
      } finally {
        setIsRendering(false)
      }
    },
    [],
  )

  const initRoom = useCallback(async (room: Room, sectionDecors: Map<string, Decor>) => {
    const compositor = compositorRef.current
    if (!compositor) {
      return
    }

    setIsRendering(true)
    try {
      await compositor.renderBase(room.layers.base)
    } finally {
      setIsRendering(false)
    }

    const preloadTasks: Array<Promise<void>> = [
      preloadImage(room.layers.shadow),
      ...room.sections.map((section) => preloadImage(section.uvMask)),
      ...Array.from(sectionDecors.values()).map((decor) => preloadDecorTiles(decor.tile512)),
    ]

    if (room.layers.reflection) {
      preloadTasks.push(preloadImage(room.layers.reflection))
    }

    void Promise.allSettled(preloadTasks).then(async () => {
      await compositor.render({ room, sectionDecors, quality: 'low' })
    })
  }, [])

  const renderProgressive = useCallback(
    async (room: Room, sectionDecors: Map<string, Decor>) => {
      await render(room, sectionDecors, 'low')

      const hdTasks = Array.from(sectionDecors.values()).map((decor) =>
        preloadDecorTiles(decor.tile512, decor.tile2048),
      )
      await Promise.allSettled(hdTasks)

      await render(room, sectionDecors, 'high')
    },
    [render],
  )

  const clearCache = useCallback(() => {
    compositorRef.current?.clearCache()
  }, [])

  return {
    attachCanvas,
    isReady,
    isRendering,
    initRoom,
    render,
    renderProgressive,
    clearCache,
  }
}
