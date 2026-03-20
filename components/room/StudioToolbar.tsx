interface StudioToolbarProps {
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
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleCompare}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500"
      >
        {compareActive ? 'Exit Compare' : 'Compare'}
      </button>
      <button
        type="button"
        onClick={onResetSection}
        disabled={!canResetSection}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
      >
        Reset Section
      </button>
      <button
        type="button"
        onClick={onResetAll}
        disabled={!hasSelections}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-stone-500 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
      >
        Reset All
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
