'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome to StudyBuddy AI</h1>
          <p className="text-muted-foreground">Start a new chat or continue an existing conversation</p>
        </div>
        <Button onClick={() => router.push('/dashboard/chat')}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="group hover:shadow-md transition-shadow cursor-pointer hover:ring-2 hover:ring-primary/20"
          onClick={() => router.push('/dashboard/chat')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">New Chat</CardTitle>
                <CardDescription>Start a new conversation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click to start a new chat session with StudyBuddy AI
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
