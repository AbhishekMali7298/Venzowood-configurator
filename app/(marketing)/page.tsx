import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-stone-600">DecorViz</p>
      <h1 className="mt-4 text-center text-4xl font-semibold text-stone-900 sm:text-6xl">
        Virtual Design Studio
      </h1>
      <p className="mt-6 max-w-2xl text-center text-base text-stone-700 sm:text-lg">
        Canvas-based room compositing with hotspot-driven decor customization.
      </p>
      <Link
        href="/rooms"
        className="mt-10 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
      >
        Browse Rooms
      </Link>
    </main>
  )
}
