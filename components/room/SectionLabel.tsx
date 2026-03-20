interface SectionLabelProps {
  text: string
}

export function SectionLabel({ text }: SectionLabelProps) {
  return <p className="text-sm text-stone-600">{text}</p>
}
