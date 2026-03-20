import type { DecorFilters, DecorListResponse } from '@/features/decor/types'

import { apiRequest } from './api-client'

export async function getDecors(filters: DecorFilters = {}): Promise<DecorListResponse> {
  const query = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value))
    }
  })

  const suffix = query.size ? `?${query.toString()}` : ''
  return apiRequest<DecorListResponse>(`/decors${suffix}`)
}
