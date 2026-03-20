import Link from 'next/link'

export const metadata = {
  title: 'DecorViz | Admin Uploads',
  description: 'Upload room assets used by DecorViz.',
}

export default function AdminUploadsPage() {
  return (
    <main className="rounded-xl border border-stone-300 bg-white p-6">
      <h1 className="text-2xl font-semibold text-stone-900">Asset Uploads</h1>
      <p className="mt-2 text-sm text-stone-600">
        Upload workflow is integrated into the Room Manager so assets are saved with room metadata in one flow.
      </p>
      <Link
        href="/admin/rooms"
        className="mt-6 inline-flex rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        Open Room Manager
      </Link>
    </main>
  )
}
