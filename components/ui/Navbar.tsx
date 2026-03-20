'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  
  // Hide the global navbar if we're in the room studio (EGGER app style)
  const isStudioPage = pathname?.startsWith('/rooms/') && pathname !== '/rooms'
  
  if (isStudioPage) {
    return null
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-stone-300 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-rose-600 text-xl font-bold text-white transition group-hover:bg-rose-700">
            D
          </div>
          <div className="hidden sm:block">
            <p className="leading-none text-xl font-semibold tracking-tight text-stone-900">DecorViz</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-stone-500">
              Virtual Design Studio
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-6 text-sm font-medium text-stone-700">
          <Link href="/rooms" className="hover:text-rose-600 transition">
            Rooms
          </Link>
          <Link href="/admin" className="hover:text-rose-600 transition">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
