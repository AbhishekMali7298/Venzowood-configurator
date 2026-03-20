import { NextRequest, NextResponse } from 'next/server'

import { apiRequest } from '@/services/api-client'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return NextResponse.json(data)
}
