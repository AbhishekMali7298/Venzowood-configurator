export function RoomSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 h-8 w-64 animate-pulse rounded bg-stone-200" />
      <div className="mb-6 h-4 w-80 animate-pulse rounded bg-stone-200" />
      <div className="aspect-[16/9] w-full animate-pulse rounded-xl border border-stone-300 bg-stone-200" />
    </main>
  )
}
