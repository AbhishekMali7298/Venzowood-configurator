export interface Project {
  projectId: string
  roomId: string
  sectionDecors: Record<string, string>
  createdAt: string
  expiresAt: string
}

export interface ProjectPayload {
  roomId: string
  sectionDecors: Record<string, string>
  country: string
}
