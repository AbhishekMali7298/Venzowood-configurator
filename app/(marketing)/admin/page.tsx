import Link from 'next/link'

import { getAdminStats } from '@/services/admin-api'

export const metadata = {
  title: 'DecorViz | Admin Dashboard',
  description: 'Admin dashboard for room and asset management.',
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(() => ({ roomCount: 0, decorCount: 0 }))

  const cards = [
    {
      title: 'Room Manager',
      description: 'Create, update, or delete rooms and manage UV masks.',
      href: '/admin/rooms',
      stat: `${stats.roomCount} rooms`,
    },
    {
      title: 'Decor Manager',
      description: 'Create, update, or delete decor/veneer entries.',
      href: '/admin/decors',
      stat: `${stats.decorCount} decors`,
    },
    {
      title: 'Asset Uploads',
      description: 'Upload static assets directly to the public folder.',
      href: '/admin/uploads',
    },
  ]

  return (
    <main className="rounded-xl border border-stone-300 bg-white p-6">
      <h1 className="text-2xl font-semibold text-stone-900">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-stone-600">
        Manage room content and media used by the DecorViz room customizer.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col rounded-lg border border-stone-300 bg-stone-50 p-4 transition hover:border-stone-500 hover:bg-stone-100"
          >
            <div className="flex flex-1 flex-col">
              <h2 className="text-lg font-semibold text-stone-900">{card.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{card.description}</p>
            </div>
            {card.stat ? (
              <div className="mt-4 border-t border-stone-200 pt-3">
                <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                  {card.stat}
                </span>
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  )
}

