export interface Decor {
  code: string
  name: string
  category: string
  thumb: string
  tile512: string
  tile2048: string
  gloss: number
  availability: Record<string, boolean>
}

export interface DecorFilters {
  country?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface DecorListResponse {
  decors: Decor[]
  total: number
  page: number
  limit: number
}
