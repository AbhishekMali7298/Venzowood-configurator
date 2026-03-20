import type { StateCreator } from 'zustand'

export interface ProjectSlice {
  projectId: string | null
  isDirty: boolean
  lastSaved: Date | null
  setProjectId: (id: string | null) => void
  markDirty: () => void
  markSaved: () => void
}

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [['zustand/immer', never]],
  [],
  ProjectSlice
> = (set) => ({
  projectId: null,
  isDirty: false,
  lastSaved: null,
  setProjectId: (id) =>
    set((state) => {
      state.projectId = id
    }),
  markDirty: () =>
    set((state) => {
      state.isDirty = true
    }),
  markSaved: () =>
    set((state) => {
      state.isDirty = false
      state.lastSaved = new Date()
    }),
})
