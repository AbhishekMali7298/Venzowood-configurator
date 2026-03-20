'use client'

import type { Decor } from '@/features/decor/types'
import { serializeProject } from '@/features/project/project-service'
import { updateShareUrl } from '@/features/project/share-encoder'
import type { Project } from '@/features/project/types'
import type { Room } from '@/features/room-engine/types'
import { loadProject, saveProject } from '@/services/project-api'

interface UseProjectPersistOptions {
  room: Room
  sectionDecors: Map<string, Decor>
  decorByCode: Map<string, Decor>
  setSectionDecors: (sectionDecors: Map<string, Decor>) => void
  setProjectId: (id: string | null) => void
  markSaved: () => void
  country?: string
}

export function useProjectPersist({
  room,
  sectionDecors,
  decorByCode,
  setSectionDecors,
  setProjectId,
  markSaved,
  country = 'IN',
}: UseProjectPersistOptions) {
  const saveCurrentProject = async () => {
    const payload = serializeProject(
      {
        activeRoom: room,
        sectionDecors,
      },
      country,
    )

    const result = await saveProject(payload)
    setProjectId(result.projectId)
    markSaved()
    updateShareUrl(room.id, result.projectId)

    return result
  }

  const loadProjectById = async (projectId: string): Promise<Project> => {
    const project = await loadProject(projectId)

    if (project.roomId !== room.id) {
      throw new Error('Project does not match active room')
    }

    const mapped = new Map<string, Decor>()
    Object.entries(project.sectionDecors).forEach(([sectionId, decorCode]) => {
      const decor = decorByCode.get(decorCode)
      if (decor) {
        mapped.set(sectionId, decor)
      }
    })

    setSectionDecors(mapped)
    setProjectId(project.projectId)
    markSaved()

    return project
  }

  return {
    saveCurrentProject,
    loadProjectById,
  }
}
