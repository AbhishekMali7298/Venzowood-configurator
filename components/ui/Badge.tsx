import type { PropsWithChildren } from 'react'

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-1 text-xs font-medium text-stone-800">
      {children}
    </span>
  )
}
