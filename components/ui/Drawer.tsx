import type { PropsWithChildren } from 'react'

interface DrawerProps extends PropsWithChildren {
  open: boolean
  title?: string
  onClose: () => void
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) {
    return null
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-stone-300 bg-white p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        <button className="text-sm text-stone-700" onClick={onClose} type="button">
          Close
        </button>
      </div>
      {children}
    </aside>
  )
}
