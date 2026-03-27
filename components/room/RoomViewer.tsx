'use client'

import React, { useMemo } from 'react'

import type { Decor } from '@/features/decor/types'
import type { Room, RoomSection } from '@/features/room-engine/types'

interface RoomViewerProps {
  room: Room
  sectionDecors: Map<string, Decor>
  className?: string
  quality?: 'low' | 'high'
}

/**
 * High-performance DOM-based room viewer.
 * Replaces the Canvas compositor by leveraging the browser's GPU-accelerated
 * compositing engine using CSS blend modes and masks.
 */
export function RoomViewer({ room, sectionDecors, className, quality = 'low' }: RoomViewerProps) {
  const containerStyle: React.CSSProperties = {
    aspectRatio: `${room.width} / ${room.height}`,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1, // Create stacking context to contain high z-index overlays
  }

  const sortedSections = useMemo(() => {
    return [...room.sections].sort((a, b) => a.renderOrder - b.renderOrder)
  }, [room.sections])

  const sortedFurniture = useMemo(() => {
    return [...(room.furniture ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  }, [room.furniture])

  return (
    <div style={containerStyle} className={className + ' bg-stone-100'}>
      {/* 1. Base Layer */}
      <img
        src={room.layers.base}
        alt="Room Base"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* 2. Decor Sections */}
      {sortedSections.map((section) => {
        const decor = sectionDecors.get(section.id)
        if (!decor) return null

        const tileUrl = quality === 'high' ? decor.tile2048 : decor.tile512
        
        // CSS Mask implementation
        // Note: the -webkit prefix is often required for mask-image
        const sectionStyle: React.CSSProperties = {
          position: 'absolute',
          inset: 0,
          zIndex: 10 + section.renderOrder,
          backgroundImage: `url(${tileUrl})`,
          backgroundRepeat: 'repeat',
          // We map tileScale to backgroundSize. 
          // If tileScale is 0.1, the pattern is 10% of the room width.
          backgroundSize: `${(section.tileScale ?? 1) * 100}%`,
          WebkitMaskImage: `url(${section.uvMask})`,
          maskImage: `url(${section.uvMask})`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }

        return <div key={section.id} style={sectionStyle} />
      })}

      {/* 3. Furniture Pieces */}
      {sortedFurniture.map((piece) => (
        <img
          key={piece.id}
          src={piece.src}
          alt={piece.id}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 50 + piece.zIndex,
          }}
        />
      ))}

      {/* 4. Shadow Overlay (Multiply) */}
      <img
        src={room.layers.shadow}
        alt="Shadow Overlay"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 80,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />

      {/* 5. Highlight/Reflection Overlay (Screen) */}
      {room.layers.reflection ? (
        <img
          src={room.layers.reflection}
          alt="Reflection Overlay"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 90,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  )
}
