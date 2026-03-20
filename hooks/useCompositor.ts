'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Decor } from '@/features/decor/types'
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
    setCanvas(node)
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

    const preloadUrls = [
      room.layers.shadow,
      ...(room.layers.reflection ? [room.layers.reflection] : []),
      ...room.sections.map((section) => section.uvMask),
      ...Array.from(sectionDecors.values()).map((decor) => decor.tile512),
    ]

    void Promise.all(preloadUrls.map((url) => preloadImage(url))).then(async () => {
      await compositor.render({ room, sectionDecors, quality: 'low' })
    })
  }, [])

  const renderProgressive = useCallback(
    async (room: Room, sectionDecors: Map<string, Decor>) => {
      await render(room, sectionDecors, 'low')

      const hdUrls = Array.from(sectionDecors.values()).map((decor) => decor.tile2048)
      await Promise.all(hdUrls.map((url) => preloadImage(url)))
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
