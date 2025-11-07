"use client";

import { useState, useEffect, useRef } from "react";
import { Document, ChatSession, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  Send,
  Plus,
  Loader2,
  User,
  Bot,
  Upload,
  Paperclip,
  FileText,
  X,
} from "lucide-react";

interface ChatAreaProps {
  document?: Document | null;
  session: ChatSession | null;
  onNewChat: () => void;
  onDocumentUpload?: (file: File) => Promise<Document | undefined>;
  onDocumentRemove?: () => void;
}

export default function ChatArea({
  document,
  session,
  onNewChat,
  onDocumentUpload,
  onDocumentRemove,
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(document || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [session]);

  useEffect(() => {
    // Update current document when document prop changes
    if (document) {
      setCurrentDocument(document);
      setAttachedFile(null);
      // Clear the file input when document changes
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [document]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    if (!session) return;

    setFetchingMessages(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setFetchingMessages(false);
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Create a temporary document object for the message
    const messageDocument = currentDocument ? {
      id: currentDocument.id,
      title: currentDocument.title,
      fileUrl: currentDocument.fileUrl,
      fileSize: currentDocument.fileSize
    } : attachedFile ? {
      id: `temp-${Date.now()}`,
      title: attachedFile.name,
      fileUrl: URL.createObjectURL(attachedFile),
      fileSize: attachedFile.size
    } : undefined;

    // Optimistically add user message with document info
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      role: "user",
      content: userMessage,
      document: messageDocument,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // If there's an attached file, upload it first
      let documentId = messageDocument?.id;
      if (attachedFile && onDocumentUpload) {
        const uploadedDoc = await onDocumentUpload(attachedFile);
        documentId = uploadedDoc?.id || documentId;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          message: userMessage,
          documentId: documentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace temp message with actual messages from server
        setMessages(prev =>
          prev
            .filter(msg => msg.id !== tempUserMessage.id)
            .concat([
              {
                ...data.userMessage,
                document: messageDocument // Ensure document is included in the final message
              },
              data.assistantMessage
            ])
        );
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
      setAttachedFile(null);
      setCurrentDocument(null);
    }
  };

  function scrollToBottom() {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setAttachedFile(file);
    setUploadingFile(true);

    // Create a temporary document object for the UI
    const tempDocument: Document = {
      id: `temp-${Date.now()}`,
      userId: 'temp',
      fileName: file.name,
      title: file.name,
      fileUrl: URL.createObjectURL(file),
      fileSize: file.size,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadDate: new Date().toISOString()
    };

    setCurrentDocument(tempDocument);
    setUploadingFile(false);
    
    // Reset the file input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setCurrentDocument(null);
    // Reset the file input when removing attachment
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Don't remove the document from the session as it might be in use by other messages
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="border-b p-3 md:p-4 flex flex-col gap-3 bg-background shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-semibold truncate">
              Study Buddy Chat
            </h2>
            <p className="text-xs text-muted-foreground">
              {session ? "Ask me anything!" : "Start a new chat to begin"}
            </p>
          </div>
        </div>

        {/* Display attached PDF Info */}
        {document && session && (
          <Card className="p-3 bg-muted/50 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{document.title}</p>
                <p className="text-xs text-muted-foreground">
                  PDF • {(document.fileSize / 1024).toFixed(1)} KB • Context
                  attached
                </p>
              </div>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="ghost" size="sm">
                  <span className="text-xs">View PDF</span>
                </Button>
              </a>
            </div>
          </Card>
        )}
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4 p-3 md:p-4">
          {!session ? (
            <Card className="p-6 md:p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-3 md:p-4 rounded-full">
                  <Bot className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Ready to Study!
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-4 px-2">
                  {document
                    ? `Start a new chat session to ask questions about "${document.title}"`
                    : "Start a new chat session to ask questions or get help with your studies"}
                </p>
                <Button
                  onClick={onNewChat}
                  size="sm"
                  className="md:size-default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </Card>
          ) : fetchingMessages ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <Card className="p-4 md:p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-primary/10 p-2 md:p-3 rounded-full">
                  <Bot className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground px-2">
                Ask me anything - I can help with homework, explain concepts, or
                answer questions!
              </p>
            </Card>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </Avatar>
                )}

                <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[75%]">
                  <Card
                    className={`p-3 md:p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {/* Show PDF attachment for user messages when document is attached */}
                    {message.role === "user" && message.document && (
                      <div className="mb-2 pb-2 border-b border-primary-foreground/20">
                        <div className="flex items-center gap-2 bg-primary-foreground/10 rounded px-2 py-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">
                              {message.document.title}
                            </p>
                            <p className="text-[10px] opacity-70">
                              PDF • {(message.document.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs md:text-sm whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                  </Card>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                  </Avatar>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </Avatar>
              <Card className="p-3 md:p-4 bg-muted">
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              </Card>
            </div>
          )}

          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      {session && (
        <div className="border-t p-3 md:p-4 bg-background shrink-0">
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex gap-2 items-end">
              {onDocumentUpload && (
                <>
                  <label htmlFor="chat-area-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-[50px] w-[50px] md:h-auto md:w-auto md:px-4 shrink-0"
                      asChild
                      disabled={uploadingFile}
                    >
                      <span className="cursor-pointer flex items-center gap-2">
                        <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="hidden md:inline">PDF</span>
                      </span>
                    </Button>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="chat-area-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploadingFile}
                  />
                </>
              )}

              {/* Textarea with PDF chip inside */}
              <div className="flex-1 relative">
                <div className="border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {/* PDF chip inside textarea area */}
                  {(attachedFile || currentDocument || uploadingFile) && (
                    <div className="px-3 pt-2 pb-1 border-b">
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate max-w-[150px]">
                          {attachedFile?.name ||
                            currentDocument?.title ||
                            "Uploading..."}
                        </span>
                        {uploadingFile ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : (
                          <button
                            onClick={handleRemoveAttachment}
                            className="shrink-0 hover:bg-primary/20 rounded-full p-0.5"
                            title="Remove attachment"
                          >
                            <X className="h-3 w-3 text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      document
                        ? "Ask a question about the document..."
                        : "Ask me anything..."
                    }
                    className="min-h-[50px] md:min-h-[60px] max-h-[150px] md:max-h-[200px] resize-none text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={loading || uploadingFile}
                  />
                </div>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading || uploadingFile}
                size="default"
                className="self-end h-[50px] w-[50px] md:h-auto md:w-auto md:px-4 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
