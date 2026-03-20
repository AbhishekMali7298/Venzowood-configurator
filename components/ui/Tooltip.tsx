import type { PropsWithChildren } from 'react'

interface TooltipProps extends PropsWithChildren {
  text: string
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-xs text-white group-hover:block">
        {text}
      </span>
    </span>
  )
}
