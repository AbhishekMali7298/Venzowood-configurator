'use client'

import { useMemo } from 'react'

import type { HotspotConfig } from '@/features/hotspot/hotspot-engine'
import { denormalizeHotspots } from '@/features/hotspot/hotspot-engine'

export function useHotspots(
  hotspots: HotspotConfig[],
  width: number,
  height: number,
): Array<HotspotConfig & { px: number; py: number }> {
  return useMemo(() => denormalizeHotspots(hotspots, width, height), [hotspots, width, height])
}
