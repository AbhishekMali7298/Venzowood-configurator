import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import type { DecorSlice } from './decorSlice'
import type { ProjectSlice } from './projectSlice'
import type { RoomSlice } from './roomSlice'
import type { UISlice } from './uiSlice'

export type AppStore = RoomSlice & DecorSlice & UISlice & ProjectSlice

export const useStore = create<AppStore>()(
  devtools(
    immer((set) => ({
      activeRoom: null,
      activeSection: null,
      setRoom: (room) =>
        set((state) => {
          state.activeRoom = room
        }),
      setActiveSection: (id) =>
        set((state) => {
          state.activeSection = id
        }),

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
          state.isDirty = true
        }),
      resetSection: (sectionId) =>
        set((state) => {
          state.sectionDecors.delete(sectionId)
          state.isDirty = true
        }),
      resetAll: () =>
        set((state) => {
          state.sectionDecors = new Map()
          state.isDirty = true
        }),

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
    })),
  ),
)
