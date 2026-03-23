import type { Decor } from '@/features/decor/types'

// EGGER rooms have a different naming convention from our DB
const bgMapper: Record<string, string> = {
  'living-room-01': 'room1',
  'kitchen-room-01': 'room2',
  'dining-room-01': 'room3',
  'bedroom-room-01': 'room4',
  'family-room-01': 'room5',
  'office-room-01': 'room7',
  'retail-room-01': 'room8',
  'studio-room-01': 'room9',
  'showroom-room-01': 'room10',
  'workspace-room-01': 'room11',
}

// EGGER applies specific surface names per room
const surfaceMapper: Record<string, Record<string, string>> = {
  'living-room-01': {
    'wall-main': 'wall',
    floor: 'floor',
    countertop: 'alle-flaechen-couchtisch-nussbaum',
    cabinet: 'wohnkombination-nussbaum',
  },
}

export function buildEggerRenderUrl(
  roomId: string,
  sectionDecors: Map<string, Decor>,
  width = 1920,
  height = 1080,
): string | null {
  const eggerRoomId = bgMapper[roomId]
  if (!eggerRoomId) return null

  const baseUrl = `https://rest.vds-egger.com/render/room/${eggerRoomId}/zoom/100/100/0/0`
  const params = new URLSearchParams()

  const mapping = surfaceMapper[roomId]

  if (mapping) {
    for (const [ourSectionId, eggerParam] of Object.entries(mapping)) {
      const decor = sectionDecors.get(ourSectionId)
      if (decor) {
        // EGGER API requires exact matches and throws 500 errors if a texture isn't pre-rendered.
        // We map commonly clicked ones, and fallback to W1000 (Premium White) to guarantee a 200 OK.
        let eggerDecorCode = 'W1000_0deg_regular' 
        
        if (decor.code.includes('W1000')) eggerDecorCode = 'W1000_0deg_regular'
        if (decor.code.includes('H1369') || decor.code.includes('H1385')) eggerDecorCode = 'H1369_0deg_regular'
        if (decor.code.includes('H3309')) eggerDecorCode = 'H3309_ST28_0deg_regular'

        params.append(eggerParam, `${eggerDecorCode},bright,0`)
      }
    }
  }

  params.append('hd', '0')

  const eggerUrl = `${baseUrl}?${params.toString()}`
  return `/api/egger-proxy?url=${encodeURIComponent(eggerUrl)}`
}
