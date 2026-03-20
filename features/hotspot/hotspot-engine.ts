export interface HotspotConfig {
  id: string
  nx: number
  ny: number
  label: string
  surfaceType: string
}

export function denormalizeHotspots(
  hotspots: HotspotConfig[],
  canvasWidth: number,
  canvasHeight: number,
): Array<HotspotConfig & { px: number; py: number }> {
  return hotspots.map((hotspot) => ({
    ...hotspot,
    px: hotspot.nx * canvasWidth,
    py: hotspot.ny * canvasHeight,
  }))
}
