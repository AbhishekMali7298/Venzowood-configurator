interface DecorSearchProps {
  value: string
  onChange: (value: string) => void
}

export function DecorSearch({ value, onChange }: DecorSearchProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search decor"
      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
    />
  )
}
