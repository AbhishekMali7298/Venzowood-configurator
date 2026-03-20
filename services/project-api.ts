import type { Project, ProjectPayload } from '@/features/project/types'

import { apiRequest } from './api-client'

interface SaveProjectResponse {
  projectId: string
  shareUrl: string
  expiresAt: string
}

export async function saveProject(payload: ProjectPayload): Promise<SaveProjectResponse> {
  return apiRequest<SaveProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loadProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`)
}
