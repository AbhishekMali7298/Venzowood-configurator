import type { DecorFilters, DecorListResponse } from '@/features/decor/types'

import { apiRequest } from './api-client'

const CATALOGUE_CACHE_PREFIX = 'decor_catalogue_v2'
const CATALOGUE_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface DecorCacheEntry {
  timestamp: number
  data: DecorListResponse
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function buildQuery(filters: DecorFilters): URLSearchParams {
  const query = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value))
    }
  })

  return query
}

function getCacheKey(query: URLSearchParams): string {
  return `${CATALOGUE_CACHE_PREFIX}:${query.toString() || 'all'}`
}

function readCached(key: string): DecorListResponse | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw) as DecorCacheEntry
    if (Date.now() - entry.timestamp > CATALOGUE_CACHE_TTL_MS) {
      window.localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

function writeCached(key: string, data: DecorListResponse): void {
  if (!canUseStorage()) {
    return
  }

  try {
    const entry: DecorCacheEntry = {
      timestamp: Date.now(),
      data,
    }

    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Ignore storage quota/security errors.
  }
}

export async function getDecors(filters: DecorFilters = {}): Promise<DecorListResponse> {
  const query = buildQuery(filters)
  const cacheKey = getCacheKey(query)
  const cached = readCached(cacheKey)
  if (cached) {
    return cached
  }

  const suffix = query.size ? `?${query.toString()}` : ''

  try {
    const response = await apiRequest<DecorListResponse>(`/decors${suffix}`)
    writeCached(cacheKey, response)
    return response
  } catch (error) {
    const fallback = readCached(cacheKey)
    if (fallback) {
      return fallback
    }

    throw error
  }
}
