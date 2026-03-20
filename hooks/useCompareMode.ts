'use client'

import { useState } from 'react'

export function useCompareMode() {
  const [isActive, setIsActive] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(0.5)

  return {
    isActive,
    sliderPosition,
    setIsActive,
    setSliderPosition,
  }
}
