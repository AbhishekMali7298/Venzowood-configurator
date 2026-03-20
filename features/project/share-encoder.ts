export function updateShareUrl(roomId: string, projectId: string): void {
  const url = new URL(window.location.href)
  url.pathname = `/rooms/${roomId}`
  url.searchParams.set('project', projectId)
  window.history.replaceState({}, '', url.toString())
}
