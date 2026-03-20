interface StudioToolbarProps {
  compareActive: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onToggleCompare: () => void
  onRefreshBaseline: () => void
  onSaveProject: () => void
  onExportPng: () => void
}

export function StudioToolbar({
  compareActive,
  saveState,
  onToggleCompare,
  onRefreshBaseline,
  onSaveProject,
  onExportPng,
}: StudioToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleCompare}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
      >
        {compareActive ? 'Exit Compare' : 'Compare'}
      </button>
      {compareActive ? (
        <button
          type="button"
          onClick={onRefreshBaseline}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
        >
          Refresh Baseline
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSaveProject}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
      >
        {saveState === 'saving' ? 'Saving...' : 'Save Project'}
      </button>
      <button
        type="button"
        onClick={onExportPng}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
      >
        Export PNG
      </button>
    </div>
  )
}
