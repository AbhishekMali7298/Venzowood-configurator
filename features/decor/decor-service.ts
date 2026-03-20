import type { Decor, DecorFilters } from '@/features/decor/types'
import { getDecors } from '@/services/decor-api'

const decorCache = new Map<string, Decor[]>()

export async function loadDecorCatalogue(filters: DecorFilters = {}): Promise<Decor[]> {
  const key = JSON.stringify(filters)
  const cached = decorCache.get(key)
  if (cached) {
    return cached
  }

  const response = await getDecors(filters)
  decorCache.set(key, response.decors)
  return response.decors
}
