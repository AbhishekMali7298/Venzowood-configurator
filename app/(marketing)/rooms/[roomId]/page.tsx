import type { Metadata } from 'next'

interface RoomPageProps {
  params: {
    roomId: string
  }
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  return {
    title: `DecorViz | ${params.roomId}`,
    description: 'Room customization shell',
  }
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-stone-900">Room: {params.roomId}</h1>
      <p className="mt-3 text-stone-700">
        Compositor shell scaffolded and ready for feature implementation.
      </p>
    </main>
  )
}
