import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden bg-stone-900 px-6 py-24 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-stone-900 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent" />

      <div className="relative z-10 flex max-w-5xl flex-col items-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">
          DecorViz
        </p>
        <h1 className="mt-4 text-center text-5xl font-light tracking-tight text-white sm:text-7xl">
          Virtual Design Studio
        </h1>
        <p className="mt-8 max-w-2xl text-center text-lg font-light text-stone-300 sm:text-xl">
          Bring your interior visions to life. Experience our interactive room compositing studio with pixel-perfect hotspot-driven decor customization.
        </p>
        <Link
          href="/rooms"
          className="mt-12 group relative inline-flex items-center justify-center rounded-sm bg-rose-600 px-8 py-4 text-sm font-semibold tracking-wide text-white transition-all hover:bg-rose-700 hover:shadow-xl hover:-translate-y-0.5"
        >
          BROWSE ROOMS
          <span className="ml-3 transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </main>
  )
}

