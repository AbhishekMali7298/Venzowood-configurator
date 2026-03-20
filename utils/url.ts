import { getCdnBaseUrl } from '@/services/api-client'

export function buildCdnUrl(path: string): string {
  return `${getCdnBaseUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function buildTileUrl(decorCode: string, resolution: 512 | 2048): string {
  return buildCdnUrl(`decors/${decorCode}/tile-${resolution}.webp`)
}
