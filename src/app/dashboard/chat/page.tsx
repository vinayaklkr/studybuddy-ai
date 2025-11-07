"use client";

import { useState, useEffect } from "react";
import { Document, ChatSession } from "@/types";
import ChatArea from "@/components/ChatArea";
import {
  Card,
 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

export default function ChatModePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
    fetchAllSessions();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllSessions() {
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }

  async function handleSelectSession(session: ChatSession) {
    setSelectedSession(session);
    setSelectedDocument(null);

    // If session has a document, fetch it
    if (session.documentId) {
      try {
        const response = await fetch(`/api/documents/${session.documentId}`);
        if (response.ok) {
          const doc = await response.json();
          setSelectedDocument(doc);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    }
  }

  async function handleDocumentUpload(file: File): Promise<Document | undefined> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newDocument = await response.json();
        setDocuments([newDocument, ...documents]);
        setSelectedDocument(newDocument);

        // If there's an existing session, attach the document to it
        if (selectedSession) {
          // Update the session to include the document
          await fetch(`/api/sessions/${selectedSession.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: newDocument.id,
            }),
          });

          // Refresh the session list to show updated session
          fetchAllSessions();
        } else {
          // Create a new chat session with this document
          const sessionResponse = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: newDocument.id,
              title: `Chat about ${newDocument.title}`,
            }),
          });

          if (sessionResponse.ok) {
            const newSession = await sessionResponse.json();
            setSelectedSession(newSession);
            fetchAllSessions();
          }
        }

        return newDocument;
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload document");
        return undefined;
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
      return undefined;
    }
  }

  async function handleDocumentRemove() {
    // Clear the selected document from the session
    if (selectedSession) {
      try {
        await fetch(`/api/sessions/${selectedSession.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: null,
          }),
        });

        setSelectedDocument(null);
        fetchAllSessions();
      } catch (error) {
        console.error("Error removing document from session:", error);
      }
    } else {
      setSelectedDocument(null);
    }
  }

  async function handleSelectDocument(document: Document) {
    setSelectedDocument(document);
    setSelectedSession(null);

    try {
      const response = await fetch(`/api/documents/${document.id}`);
      if (response.ok) {
        const fullDocument = await response.json();
        setSelectedDocument(fullDocument);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  }

  async function handleNewChat() {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument?.id || null,
          title: "New Chat",
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSelectedSession(newSession);
        // Refresh sessions list
        fetchAllSessions();
        // If document is selected, refresh it to get updated sessions
        if (selectedDocument) {
          handleSelectDocument(selectedDocument);
        }
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (
      !confirm(
        "Are you sure you want to delete this chat? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Clear selected session if it was the deleted one
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
        // Refresh sessions list
        fetchAllSessions();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete chat");
    }
  }

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     handleDocumentUpload(file);
  //     e.target.value = "";
  //   }
  // };

  // Get standalone sessions (not associated with any document)
  // const standaloneSessions = sessions.filter((s) => !s.documentId);

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-muted/10 flex flex-col h-64 lg:h-full shrink-0">
        <div className="p-3 lg:p-4 border-b shrink-0">
          <Button className="w-full" size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-2 lg:p-3 space-y-2 pb-4">
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading...
              </div>
            ) : (
              <>
                {/* All Sessions */}
                {sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`p-2 lg:p-3 group hover:bg-accent transition-colors cursor-pointer ${
                          selectedSession?.id === session.id
                            ? "bg-accent border-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <button
                            onClick={() => handleSelectSession(session)}
                            className="flex-1 text-left text-xs lg:text-sm truncate font-medium"
                          >
                            {session.title || "New Chat"}
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    <p className="mb-3">No chats yet</p>
                    <Button size="sm" onClick={handleNewChat} variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Start Chat
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatArea
          document={selectedDocument}
          session={selectedSession}
          onNewChat={handleNewChat}
          onDocumentUpload={handleDocumentUpload}
          onDocumentRemove={handleDocumentRemove}
        />
      </div>
    </div>
  );
}
