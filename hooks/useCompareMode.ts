'use client'

import { useCallback, useState } from 'react'

import type { Decor } from '@/features/decor/types'

export function useCompareMode() {
  const [isActive, setIsActive] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(0.5)
  const [baselineDecors, setBaselineDecors] = useState<Map<string, Decor>>(new Map())

  const enable = useCallback((current: Map<string, Decor>) => {
    setBaselineDecors(new Map(current))
    setIsActive(true)
  }, [])

  const disable = useCallback(() => {
    setIsActive(false)
    setSliderPosition(0.5)
    setBaselineDecors(new Map())
  }, [])

  const toggle = useCallback(
    (current: Map<string, Decor>) => {
      if (isActive) {
        disable()
        return
      }

      enable(current)
    },
    [disable, enable, isActive],
  )

  const refreshBaseline = useCallback((current: Map<string, Decor>) => {
    setBaselineDecors(new Map(current))
  }, [])

  return {
    isActive,
    sliderPosition,
    baselineDecors,
    setSliderPosition,
    toggle,
    enable,
    disable,
    refreshBaseline,
  }
}
