'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface AdminShellProps {
  children: ReactNode
}

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/rooms', label: 'Room Manager' },
  { href: '/admin/uploads', label: 'Asset Uploads' },
]

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-8">
        <aside className="w-64 shrink-0 rounded-xl border border-stone-300 bg-white p-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">DecorViz Admin</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            Use this panel to create rooms, upload layers/masks, and manage room records.
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  )
}
