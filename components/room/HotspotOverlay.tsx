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
  const resolved = denormalizeHotspots(hotspots, canvasWidth, canvasHeight)

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {resolved.map((hotspot) => (
        <g
          key={hotspot.id}
          onClick={() => onSelect(hotspot.id)}
          className="pointer-events-auto cursor-pointer"
          role="button"
          aria-label={`Customize ${hotspot.label}`}
          data-testid={`hotspot-${hotspot.id}`}
        >
          <circle cx={hotspot.px} cy={hotspot.py} r={28} fill="transparent" />
          <circle
            cx={hotspot.px}
            cy={hotspot.py}
            r={14}
            fill="none"
            stroke={activeSection === hotspot.id ? '#e63946' : 'white'}
            strokeWidth={2}
            className="transition-all duration-200"
          />
          <circle
            cx={hotspot.px}
            cy={hotspot.py}
            r={5}
            fill={activeSection === hotspot.id ? '#e63946' : 'white'}
            className="transition-all duration-200"
          />
        </g>
      ))}
    </svg>
  )
}
