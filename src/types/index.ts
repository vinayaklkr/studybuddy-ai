export interface User {
  id: string
  name: string
  email: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Document {
  id: string
  userId: string
  title: string
  fileName: string
  fileUrl: string
  fileSize: number
  content: string
  uploadDate?: string
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  sessions?: ChatSession[]
}

export interface ChatSession {
  id: string
  userId: string
  documentId: string | null
  title: string | null
  createdAt: Date | string
  updatedAt: Date | string
  user?: User
  document?: Document
  messages?: Message[]
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date | string
  document?: {
    id: string
    title: string
    fileUrl: string
    fileSize: number
  } | null
}
