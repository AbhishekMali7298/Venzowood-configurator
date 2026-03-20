'use client'

import { useEffect, useRef } from 'react'

interface RoomCanvasProps {
  width: number
  height: number
  onReady?: (canvas: HTMLCanvasElement) => void
}

export function RoomCanvas({ width, height, onReady }: RoomCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) {
      onReady?.(ref.current)
    }
  }, [onReady])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="h-auto w-full rounded-xl border border-stone-300 bg-white"
      data-testid="room-canvas"
    />
  )
}
