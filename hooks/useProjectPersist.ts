'use client'

import type { ProjectPayload } from '@/features/project/types'
import { loadProject, saveProject } from '@/services/project-api'

export function useProjectPersist() {
  return {
    saveProject: (payload: ProjectPayload) => saveProject(payload),
    loadProject: (id: string) => loadProject(id),
  }
}
