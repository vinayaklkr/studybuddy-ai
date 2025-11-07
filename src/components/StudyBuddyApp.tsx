'use client'

import { useState, useEffect } from 'react'
import { Document, ChatSession } from '@/types'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import WelcomeScreen from './WelcomeScreen'
import SetupWarning from './SetupWarning'

export default function StudyBuddyApp() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
        setSetupError(null) // Clear any previous errors
      } else {
        // Try to parse error message
        try {
          const errorData = await response.json()
          setSetupError(errorData.error || 'Failed to fetch documents')
        } catch {
          setSetupError('Failed to connect to the server. Please check your setup.')
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setSetupError('Failed to connect to the server. Please check your setup.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDocumentUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newDocument = await response.json()
        setDocuments([newDocument, ...documents])
        setSelectedDocument(newDocument)
        setSelectedSession(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    }
  }

  async function handleNewChat() {
    if (!selectedDocument) return

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          title: 'New Chat',
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        setSelectedSession(newSession)
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  async function handleSelectDocument(document: Document) {
    setSelectedDocument(document)
    setSelectedSession(null)

    // Fetch document with sessions
    try {
      const response = await fetch(`/api/documents/${document.id}`)
      if (response.ok) {
        const fullDocument = await response.json()
        setSelectedDocument(fullDocument)
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.id !== documentId))
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null)
          setSelectedSession(null)
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Show setup warning if there's a configuration error
  if (setupError) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          documents={[]}
          selectedDocument={null}
          selectedSession={null}
          onDocumentUpload={handleDocumentUpload}
          onSelectDocument={handleSelectDocument}
          onSelectSession={setSelectedSession}
          onDeleteDocument={handleDeleteDocument}
          onNewChat={handleNewChat}
          loading={false}
        />
        <SetupWarning error={setupError} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        documents={documents}
        selectedDocument={selectedDocument}
        selectedSession={selectedSession}
        onDocumentUpload={handleDocumentUpload}
        onSelectDocument={handleSelectDocument}
        onSelectSession={setSelectedSession}
        onDeleteDocument={handleDeleteDocument}
        onNewChat={handleNewChat}
        loading={loading}
      />

      {selectedDocument ? (
        <ChatArea
          document={selectedDocument}
          session={selectedSession}
          onNewChat={handleNewChat}
        />
      ) : (
        <WelcomeScreen onDocumentUpload={handleDocumentUpload} />
      )}
    </div>
  )
}
