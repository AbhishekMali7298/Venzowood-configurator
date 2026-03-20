'use client'

import { useEffect, useRef } from 'react'

interface RoomCanvasProps {
  width: number
  height: number
  onReady?: (canvas: HTMLCanvasElement) => void
  className?: string
}

export function RoomCanvas({ width, height, onReady, className }: RoomCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reportedCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !onReady || reportedCanvasRef.current === canvas) {
      return
    }

    reportedCanvasRef.current = canvas
    onReady(canvas)
  }, [onReady])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className ?? 'h-auto w-full rounded-xl border border-stone-300 bg-white'}
      data-testid="room-canvas"
    />
  )
}
