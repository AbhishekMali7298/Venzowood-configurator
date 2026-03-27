import type { StateCreator } from 'zustand'

export interface UISlice {
  drawerOpen: boolean
  compareMode: boolean
  isRendering: boolean
  // Drawer Filter State
  drawerSearch: string
  drawerSelectedGroup: string | null
  drawerExpandedGroup: string | null
  drawerSubCategory: string

  setDrawerOpen: (open: boolean) => void
  setDrawerFilters: (filters: {
    search?: string
    selectedGroup?: string | null
    expandedGroup?: string | null
    subCategory?: string
  }) => void
  setCompareMode: (active: boolean) => void
  setRendering: (rendering: boolean) => void
}

export const createUiSlice: StateCreator<UISlice, [['zustand/immer', never]], [], UISlice> = (
  set,
) => ({
  drawerOpen: false,
  compareMode: false,
  isRendering: false,
  drawerSearch: '',
  drawerSelectedGroup: null,
  drawerExpandedGroup: null,
  drawerSubCategory: 'all',

  setDrawerOpen: (open) =>
    set((state) => {
      state.drawerOpen = open
    }),
  setDrawerFilters: (filters) =>
    set((state) => {
      if (filters.search !== undefined) state.drawerSearch = filters.search
      if (filters.selectedGroup !== undefined) state.drawerSelectedGroup = filters.selectedGroup
      if (filters.expandedGroup !== undefined) state.drawerExpandedGroup = filters.expandedGroup
      if (filters.subCategory !== undefined) state.drawerSubCategory = filters.subCategory
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
