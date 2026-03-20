import { useState } from 'react'
import type { HotspotConfig } from '@/features/hotspot/hotspot-engine'
import { denormalizeHotspots } from '@/features/hotspot/hotspot-engine'

interface HotspotOverlayProps {
  hotspots: HotspotConfig[]
  canvasWidth: number
  canvasHeight: number
  activeSection: string | null
  onSelect: (id: string) => void
}

export function HotspotOverlay({
  hotspots,
  canvasWidth,
  canvasHeight,
  activeSection,
  onSelect,
}: HotspotOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const resolved = denormalizeHotspots(hotspots, canvasWidth, canvasHeight)

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {resolved.map((hotspot) => {
        const isHovered = hoveredId === hotspot.id
        const isActive = activeSection === hotspot.id
        
        return (
          <g
            key={hotspot.id}
            onClick={() => onSelect(hotspot.id)}
            onMouseEnter={() => setHoveredId(hotspot.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="pointer-events-auto cursor-pointer"
            role="button"
            aria-label={`Customize ${hotspot.label}`}
            data-testid={`hotspot-${hotspot.id}`}
          >
            {/* Tooltip Background */}
            <rect
              x={hotspot.px + 24}
              y={hotspot.py - 12}
              width={hotspot.label.length * 8 + 16}
              height={24}
              rx={4}
              fill="white"
              opacity={isHovered ? 0.95 : 0}
              className="transition-opacity duration-200"
              style={{ pointerEvents: 'none' }}
            />
            {/* Tooltip Text */}
            <text
              x={hotspot.px + 32}
              y={hotspot.py + 4}
              fontSize="12"
              fill="#1c1917"
              fontWeight="500"
              opacity={isHovered ? 1 : 0}
              className="transition-opacity duration-200 drop-shadow-sm"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {hotspot.label}
            </text>

            {/* Hotspot Hit Area */}
            <circle cx={hotspot.px} cy={hotspot.py} r={28} fill="transparent" />
            
            {/* Hotspot Outer Ring */}
            <circle
              cx={hotspot.px}
              cy={hotspot.py}
              r={14}
              fill="none"
              stroke={isActive || isHovered ? '#e11d48' : 'white'}
              strokeWidth={2}
              className="transition-all duration-200 shadow-sm"
            />
            
            {/* Hotspot Inner Dot */}
            <circle
              cx={hotspot.px}
              cy={hotspot.py}
              r={5}
              fill={isActive || isHovered ? '#e11d48' : 'white'}
              className="transition-all duration-200"
            />
          </g>
        )
      })}
    </svg>
  )
}

