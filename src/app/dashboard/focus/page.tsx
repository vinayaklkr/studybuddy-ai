'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, StopCircle, Zap, Clock, Target } from 'lucide-react'

interface StudySession {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  duration?: number
  focusMode: boolean
  completed: boolean
}

export default function FocusModePage() {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [time, setTime] = useState(0)
  const [targetDuration, setTargetDuration] = useState(25 * 60) // 25 minutes default
  const [strictMode, setStrictMode] = useState(false)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/study-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }, [])

  const handleStop = useCallback(async () => {
    if (!currentSession) {
      console.error('No current session to stop')
      return
    }

    // Stop the timer first
    setIsActive(false)
    setIsPaused(false)

    try {
      const durationInMinutes = Math.max(1, Math.floor(time / 60)) // At least 1 minute

      console.log('Ending session:', {
        sessionId: currentSession.id,
        duration: durationInMinutes,
        completed: true
      })

      const response = await fetch(`/api/study-sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          duration: durationInMinutes,
        }),
      })

      if (response.ok) {
        console.log('Session ended successfully')
        // Reset state
        setTime(0)
        setCurrentSession(null)
        setSessionTitle('')
        setSessionDescription('')
        // Refresh sessions list
        await fetchSessions()
        alert('Session completed successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to end session:', errorData)
        alert(`Failed to end session: ${errorData.error || 'Unknown error'}`)
        // Restore active state if failed
        setIsActive(true)
      }
    } catch (error) {
      console.error('Error stopping session:', error)
      alert('Failed to end session. Please try again.')
      // Restore active state if failed
      setIsActive(true)
    }
  }, [currentSession, time, fetchSessions])

  useEffect(() => {
    // Initial fetch on mount
    async function loadSessions() {
      try {
        const response = await fetch('/api/study-sessions')
        if (response.ok) {
          const data = await response.json()
          setSessions(data)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    loadSessions()
  }, [])

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1

          // Auto-complete when target reached
          if (newTime >= targetDuration) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => handleStop(), 0)
            return targetDuration
          }

          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, targetDuration, handleStop])

  async function handleStart() {
    if (!sessionTitle.trim()) {
      alert('Please enter a session title')
      return
    }

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionTitle,
          description: sessionDescription,
          focusMode: strictMode,
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        setCurrentSession(newSession)
        setIsActive(true)
        setIsPaused(false)
        setTime(0)

        // Show notification for strict mode
        if (strictMode) {
          console.log('Strict mode session started - pausing disabled')
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start session. Please try again.')
    }
  }

  function handlePause() {
    setIsPaused(!isPaused)
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (time / targetDuration) * 100

  const todaySessions = sessions.filter((session) => {
    const sessionDate = new Date(session.startTime)
    const today = new Date()
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    )
  })

  const totalStudyTime = todaySessions.reduce((acc, session) => acc + (session.duration || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Focus Mode</h2>
            <p className="text-sm text-muted-foreground">
              Distraction-free study sessions
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Timer */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Study Timer</CardTitle>
                    <CardDescription>
                      {isActive ? 'Session in progress' : 'Start a new focus session'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className={`h-5 w-5 ${strictMode ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <Switch
                      checked={strictMode}
                      onCheckedChange={setStrictMode}
                      disabled={isActive}
                    />
                    <span className={`text-sm font-medium ${strictMode ? 'text-amber-500' : ''}`}>
                      Strict Mode {strictMode ? '(ON)' : '(OFF)'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isActive ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Session Title *</label>
                      <Input
                        placeholder="e.g., Mathematics Study Session"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (Optional)</label>
                      <Textarea
                        placeholder="What will you study?"
                        value={sessionDescription}
                        onChange={(e) => setSessionDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Duration (minutes)</label>
                      <Input
                        type="number"
                        value={targetDuration / 60}
                        onChange={(e) => setTargetDuration(parseInt(e.target.value || '25') * 60)}
                        min="1"
                        max="240"
                      />
                    </div>

                    {strictMode && (
                      <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-amber-500">Strict Mode Enabled</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ⚠️ Once started, you cannot pause the session. Only stop is allowed. Stay fully focused!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentSession && (
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{currentSession.title}</h3>
                          {currentSession.focusMode && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                              <Zap className="h-3 w-3 mr-1" />
                              Strict Mode
                            </Badge>
                          )}
                        </div>
                        {currentSession.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {currentSession.description}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-6xl font-bold font-mono mb-4">
                        {formatTime(time)}
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Target: {formatTime(targetDuration)}
                      </p>
                    </div>

                    {isPaused && (
                      <div className="text-center text-sm text-muted-foreground">
                        Session Paused
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {!isActive ? (
                    <Button onClick={handleStart} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Start Session
                    </Button>
                  ) : (
                    <>
                      {!strictMode && (
                        <Button
                          onClick={handlePause}
                          size="lg"
                          variant="outline"
                          className="gap-2"
                        >
                          <Pause className="h-5 w-5" />
                          {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                      )}
                      <Button
                        onClick={handleStop}
                        size="lg"
                        variant="destructive"
                        className="gap-2"
                      >
                        <StopCircle className="h-5 w-5" />
                        End Session
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Progress</CardTitle>
                <CardDescription>Your study sessions today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-medium">Total Time</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
                  </p>
                </div>

                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-2 text-secondary-foreground mb-2">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-medium">Sessions</span>
                  </div>
                  <p className="text-2xl font-bold">{todaySessions.length}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Sessions</h4>
                  {todaySessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions yet today</p>
                  ) : (
                    <div className="space-y-2">
                      {todaySessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="p-2 border rounded text-xs space-y-1"
                        >
                          <div className="font-medium truncate">{session.title}</div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>{session.duration} min</span>
                            {session.focusMode && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Zap className="h-3 w-3" />
                                Strict
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
