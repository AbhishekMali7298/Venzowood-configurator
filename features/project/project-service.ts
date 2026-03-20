import type { Room } from '@/features/room-engine/types'
import type { Decor } from '@/features/decor/types'
import type { ProjectPayload } from '@/features/project/types'

interface ProjectState {
  activeRoom: Room | null
  sectionDecors: Map<string, Decor>
}

export function serializeProject(state: ProjectState, country: string): ProjectPayload {
  if (!state.activeRoom) {
    throw new Error('Active room is required for serialization')
  }

  return {
    roomId: state.activeRoom.id,
    sectionDecors: Object.fromEntries(
      Array.from(state.sectionDecors.entries()).map(([sectionId, decor]) => [
        sectionId,
        decor.code,
      ]),
    ),
    country,
  }
}
