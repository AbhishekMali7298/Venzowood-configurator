import { enableMapSet } from 'immer'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

enableMapSet()

import type { DecorSlice } from './decorSlice'
import type { ProjectSlice } from './projectSlice'
import type { RoomSlice } from './roomSlice'
import type { UISlice } from './uiSlice'

export type AppStore = RoomSlice & DecorSlice & UISlice & ProjectSlice

export const useStore = create<AppStore>()(
  devtools(
    persist(
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
        // Drawer Filter State
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
      {
        name: 'decorviz-session-storage',
        storage: createJSONStorage(() => sessionStorage, {
          replacer: (key, value) => {
            if (value instanceof Map) {
              return { __type: 'Map', value: Array.from(value.entries()) }
            }
            return value
          },
          reviver: (key, value: any) => {
            if (value && typeof value === 'object' && value.__type === 'Map') {
              return new Map(value.value)
            }
            return value
          },
        }),
        // Don't persist large catalogue or ephemeral UI state
        partialize: (state) => ({
          activeRoom: state.activeRoom,
          sectionDecors: state.sectionDecors,
          projectId: state.projectId,
          lastSaved: state.lastSaved,
          drawerSearch: state.drawerSearch,
          drawerSelectedGroup: state.drawerSelectedGroup,
          drawerExpandedGroup: state.drawerExpandedGroup,
          drawerSubCategory: state.drawerSubCategory,
        }),
      }
    )
  ),
)
