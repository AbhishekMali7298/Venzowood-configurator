'use client'

import { useEffect, useRef } from 'react'

interface RoomCanvasProps {
  width: number
  height: number
  onReady?: (canvas: HTMLCanvasElement) => void
  onResize?: (size: { width: number; height: number }) => void
  className?: string
}

export function RoomCanvas({ width, height, onReady, onResize, className }: RoomCanvasProps) {
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

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !onResize || typeof ResizeObserver === 'undefined') {
      return
    }

    const reportSize = () => {
      onResize({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      })
    }

    reportSize()
    const observer = new ResizeObserver(reportSize)
    observer.observe(canvas)

    return () => {
      observer.disconnect()
    }
  }, [onResize])

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
