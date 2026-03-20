'use client'

import { useCallback, useState } from 'react'

export function useDecorPicker() {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openForSection = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId)
    setDrawerOpen(true)
  }, [])

  const close = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  return {
    selectedSectionId,
    drawerOpen,
    openForSection,
    close,
  }
}
