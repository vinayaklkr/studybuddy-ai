"use client";

import { Document, ChatSession } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Card } from "@/components/ui/card";

import { Upload, FileText, MessageSquare, Plus, Trash2 } from "lucide-react";

interface SidebarProps {
  documents: Document[];
  selectedDocument: Document | null;
  selectedSession: ChatSession | null;
  onDocumentUpload: (file: File) => void;
  onSelectDocument: (document: Document) => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteDocument: (documentId: string) => void;
  onNewChat: () => void;
  loading: boolean;
}

export default function Sidebar({
  documents,
  selectedDocument,
  selectedSession,
  onDocumentUpload,
  onSelectDocument,
  onSelectSession,
  onDeleteDocument,
  onNewChat,
  loading,
}: SidebarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDocumentUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Study Buddy</h1>
        </div>

        <label htmlFor="pdf-upload">
          <Button className="w-full" asChild>
            <span className="cursor-pointer flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload PDF
            </span>
          </Button>
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No documents yet. Upload a PDF to get started!
            </div>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="space-y-2">
                <Card
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedDocument?.id === document.id ? "bg-accent" : ""
                  }`}
                  onClick={() => onSelectDocument(document)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {document.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(document.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>

                {selectedDocument?.id === document.id && (
                  <div className="ml-4 space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Chat Sessions
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={onNewChat}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {selectedDocument.sessions &&
                    selectedDocument.sessions.length > 0 ? (
                      selectedDocument.sessions.map((session) => (
                        <Card
                          key={session.id}
                          className={`p-2 cursor-pointer hover:bg-accent transition-colors ${
                            selectedSession?.id === session.id
                              ? "bg-accent"
                              : ""
                          }`}
                          onClick={() => onSelectSession(session)}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 shrink-0" />
                            <span className="text-xs truncate">
                              {session.title || "New Chat"}
                            </span>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic p-2">
                        No chat sessions yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
