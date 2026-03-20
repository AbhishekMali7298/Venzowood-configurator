import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url(),
  NEXT_PUBLIC_CDN_BASE: z.string().url(),
})

const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  NEXT_PUBLIC_CDN_BASE: process.env.NEXT_PUBLIC_CDN_BASE,
})

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { baseUrl?: string },
): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const baseUrl = options?.baseUrl ?? env.NEXT_PUBLIC_API_BASE

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? (method === 'GET' ? 'force-cache' : 'no-store'),
  })

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${path}`)
  }

  return (await response.json()) as T
}

export function getCdnBaseUrl(): string {
  return env.NEXT_PUBLIC_CDN_BASE
}
