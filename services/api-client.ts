import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url(),
  NEXT_PUBLIC_CDN_BASE: z.string().url(),
})

const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  NEXT_PUBLIC_CDN_BASE: process.env.NEXT_PUBLIC_CDN_BASE,
})

export class ApiConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiConnectionError'
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { baseUrl?: string },
): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const baseUrl = options?.baseUrl ?? env.NEXT_PUBLIC_API_BASE

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: init?.cache ?? (method === 'GET' ? 'force-cache' : 'no-store'),
    })
  } catch (error) {
    throw new ApiConnectionError(
      `Cannot reach API at ${baseUrl}. Start backend server and verify API base URL.`,
    )
  }

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${path}`)
  }

  return (await response.json()) as T
}

export function getCdnBaseUrl(): string {
  return env.NEXT_PUBLIC_CDN_BASE
}
