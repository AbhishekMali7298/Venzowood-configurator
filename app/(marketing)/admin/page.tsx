import Link from 'next/link'

export const metadata = {
  title: 'DecorViz | Admin Dashboard',
  description: 'Admin dashboard for room and asset management.',
}

const cards = [
  {
    title: 'Room Manager',
    description: 'Create or update room metadata and upload all required room assets.',
    href: '/admin/rooms',
  },
  {
    title: 'Asset Uploads',
    description: 'Upload room thumbnails, layers, and UV masks directly to static assets.',
    href: '/admin/uploads',
  },
]

export default function AdminDashboardPage() {
  return (
    <main className="rounded-xl border border-stone-300 bg-white p-6">
      <h1 className="text-2xl font-semibold text-stone-900">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-stone-600">
        Manage room content and media used by the DecorViz room customizer.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-stone-300 bg-stone-50 p-4 transition hover:border-stone-500"
          >
            <h2 className="text-lg font-semibold text-stone-900">{card.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
