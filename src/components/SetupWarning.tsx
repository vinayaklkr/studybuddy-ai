'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ExternalLink } from 'lucide-react'

interface SetupWarningProps {
  error: string
}

export default function SetupWarning({ error }: SetupWarningProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-2xl p-8 border-destructive/50">
        <div className="flex items-start gap-4">
          <div className="bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Setup Required</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-sm">Quick Setup Steps:</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Create a Supabase project at supabase.com</li>
                <li>Create a storage bucket named &quot;pdfs&quot; (make it public)</li>
                <li>Get your Supabase credentials from Project Settings</li>
                <li>Get an OpenAI API key from platform.openai.com</li>
                <li>Update the .env.local file with your credentials</li>
                <li>Run: <code className="bg-background px-2 py-1 rounded">npm run setup</code></li>
                <li>Restart the dev server</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/yourusername/studybuddy-ai#setup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  View Full Setup Guide
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
