import { NextResponse } from 'next/server'

import { apiRequest } from '@/services/api-client'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(_: Request, { params }: RouteParams) {
  const data = await apiRequest(`/projects/${params.id}`)
  return NextResponse.json(data)
}
