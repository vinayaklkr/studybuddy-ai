'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, BookOpen, MessageCircle, Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
  onDocumentUpload: (file: File) => void
}

export default function WelcomeScreen({ onDocumentUpload }: WelcomeScreenProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onDocumentUpload(file)
      e.target.value = ''
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <BookOpen className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Study Buddy
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered learning companion. Upload a PDF and start asking questions!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg w-fit">
              <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold">Upload PDFs</h3>
            <p className="text-sm text-muted-foreground">
              Upload your study materials, textbooks, or research papers
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg w-fit">
              <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold">Ask Questions</h3>
            <p className="text-sm text-muted-foreground">
              Get instant answers about your documents or related topics
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg w-fit">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold">Learn Faster</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized explanations and study assistance
            </p>
          </Card>
        </div>

        <div className="flex justify-center">
          <label htmlFor="welcome-pdf-upload">
            <Button size="lg" className="cursor-pointer" asChild>
              <span className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your First PDF
              </span>
            </Button>
          </label>
          <input
            id="welcome-pdf-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}
