import type { StateCreator } from 'zustand'

export interface UISlice {
  drawerOpen: boolean
  compareMode: boolean
  isRendering: boolean
  setDrawerOpen: (open: boolean) => void
  setCompareMode: (active: boolean) => void
  setRendering: (rendering: boolean) => void
}

export const createUiSlice: StateCreator<UISlice, [['zustand/immer', never]], [], UISlice> = (
  set,
) => ({
  drawerOpen: false,
  compareMode: false,
  isRendering: false,
  setDrawerOpen: (open) =>
    set((state) => {
      state.drawerOpen = open
    }),
  setCompareMode: (active) =>
    set((state) => {
      state.compareMode = active
    }),
  setRendering: (rendering) =>
    set((state) => {
      state.isRendering = rendering
    }),
})
