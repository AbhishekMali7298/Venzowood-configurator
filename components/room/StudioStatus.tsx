interface StudioStatusProps {
  renderReady: boolean
  compareActive: boolean
  compareReady: boolean
  projectId: string | null
  lastSaved: Date | null
  saveState: 'idle' | 'saving' | 'saved' | 'error'
}

export function StudioStatus({
  renderReady,
  compareActive,
  compareReady,
  projectId,
  lastSaved,
  saveState,
}: StudioStatusProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-stone-600">
      <span>
        Render: {renderReady ? 'Ready' : 'Rendering...'}
        {compareActive ? ` · Compare: ${compareReady ? 'Ready' : 'Rendering...'}` : ''}
      </span>
      {projectId ? <span>Project ID: {projectId}</span> : null}
      {lastSaved ? <span>Last saved: {lastSaved.toLocaleString()}</span> : null}
      {saveState === 'error' ? <span>Unable to save/load project.</span> : null}
    </div>
  )
}
