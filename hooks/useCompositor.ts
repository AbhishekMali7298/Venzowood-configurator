'use client'

import { useCallback, useMemo, useRef } from 'react'

import type { Decor } from '@/features/decor/types'
import { RoomCompositor } from '@/features/room-engine/compositor'
import type { Room } from '@/features/room-engine/types'

export function useCompositor(width: number, height: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const compositor = useMemo(() => {
    if (!canvasRef.current) {
      return null
    }

    return new RoomCompositor({
      canvas: canvasRef.current,
      width,
      height,
    })
  }, [height, width])

  const render = useCallback(
    async (room: Room, sectionDecors: Map<string, Decor>, quality: 'low' | 'high') => {
      if (!compositor) {
        return
      }
      await compositor.render({ room, sectionDecors, quality })
    },
    [compositor],
  )

  return {
    canvasRef,
    compositor,
    render,
  }
}
