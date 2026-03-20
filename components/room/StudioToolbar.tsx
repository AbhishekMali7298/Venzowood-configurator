import Link from 'next/link'

interface StudioToolbarProps {
  roomName: string
  compareActive: boolean
  canResetSection: boolean
  hasSelections: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onToggleCompare: () => void
  onRefreshBaseline: () => void
  onResetSection: () => void
  onResetAll: () => void
  onSaveProject: () => void
  onExportPng: () => void
}

export function StudioToolbar({
  roomName,
  compareActive,
  canResetSection,
  hasSelections,
  saveState,
  onToggleCompare,
  onRefreshBaseline,
  onResetSection,
  onResetAll,
  onSaveProject,
  onExportPng,
}: StudioToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-4 pb-2 md:flex-row md:items-center md:justify-between border-b border-stone-300">
      {/* Left side: Branding & Room Selection */}
      <div className="flex items-center gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-rose-600 text-white font-bold text-xl transition group-hover:bg-rose-700">
            D
          </div>
          <div className="hidden sm:block">
            <p className="text-xl font-semibold tracking-tight text-stone-900 leading-none">DecorViz</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 mt-0.5">Virtual Design Studio</p>
          </div>
        </Link>
        
        <div className="h-8 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-3">
          <Link 
            href="/rooms"
            className="rounded border border-stone-300 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition"
          >
            SELECT ROOM
          </Link>
          <span className="text-sm font-medium text-stone-900">{roomName}</span>
        </div>
      </div>

      {/* Right side: Tools */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleCompare}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition ${
            compareActive ? 'text-rose-600 bg-rose-50' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <span className="text-lg leading-none">◑</span>
          Comparison mode
        </button>

        <div className="h-5 w-px bg-stone-300 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={onResetSection}
          disabled={!canResetSection}
          className="px-2 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Reset section
        </button>
        <button
          type="button"
          onClick={onResetAll}
          disabled={!hasSelections}
          className="px-2 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Reset all
        </button>
        {compareActive ? (
          <button
            type="button"
            onClick={onRefreshBaseline}
            className="px-2 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition"
          >
            Refresh comparison
          </button>
        ) : null}

        <div className="h-5 w-px bg-stone-300 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={onSaveProject}
          className="rounded bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition shadow-sm"
        >
          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : 'Save project'}
        </button>
        <button
          type="button"
          onClick={onExportPng}
          className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-sm"
          title="Download image"
        >
          ↓
        </button>
      </div>
    </div>
  )
}
