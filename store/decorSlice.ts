import type { StateCreator } from 'zustand'

import type { Decor } from '@/features/decor/types'

export interface DecorSlice {
  catalogue: Decor[]
  sectionDecors: Map<string, Decor>
  setCatalogue: (decors: Decor[]) => void
  setSectionDecors: (sectionDecors: Map<string, Decor>) => void
  selectDecor: (sectionId: string, decor: Decor) => void
  resetSection: (sectionId: string) => void
  resetAll: () => void
}

export const createDecorSlice: StateCreator<
  DecorSlice,
  [['zustand/immer', never]],
  [],
  DecorSlice
> = (set) => ({
  catalogue: [],
  sectionDecors: new Map(),
  setCatalogue: (decors) =>
    set((state) => {
      state.catalogue = decors
    }),
  setSectionDecors: (sectionDecors) =>
    set((state) => {
      state.sectionDecors = new Map(sectionDecors)
    }),
  selectDecor: (sectionId, decor) =>
    set((state) => {
      state.sectionDecors.set(sectionId, decor)
    }),
  resetSection: (sectionId) =>
    set((state) => {
      state.sectionDecors.delete(sectionId)
    }),
  resetAll: () =>
    set((state) => {
      state.sectionDecors = new Map()
    }),
})
