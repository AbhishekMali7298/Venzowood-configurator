'use client'

interface ComparisonSliderProps {
  position: number
  onChange: (position: number) => void
}

export function ComparisonSlider({ position, onChange }: ComparisonSliderProps) {
  return (
    <input
      aria-label="Comparison split"
      className="w-full"
      type="range"
      min={0}
      max={100}
      value={Math.round(position * 100)}
      onChange={(event) => onChange(Number(event.target.value) / 100)}
    />
  )
}
