'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react'

interface Exam {
  id: string
  title: string
  description?: string
  examDate: string
  duration?: number
  subject?: string
  status: string
  priority: string
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [exams, setExams] = useState<Exam[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examDate: '',
    examTime: '',
    duration: '',
    subject: '',
    priority: 'medium'
  })

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams')
      if (response.ok) {
        const data = await response.json()
        setExams(data)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  useEffect(() => {
    // Initial fetch on mount
    fetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAddExam(e: React.FormEvent) {
    e.preventDefault()

    const examDateTime = new Date(`${formData.examDate}T${formData.examTime}`)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          examDate: examDateTime.toISOString(),
          duration: formData.duration ? parseInt(formData.duration) : null,
          subject: formData.subject,
          priority: formData.priority
        }),
      })

      if (response.ok) {
        const newExam = await response.json()
        setExams([...exams, newExam])
        setFormData({
          title: '',
          description: '',
          examDate: '',
          examTime: '',
          duration: '',
          subject: '',
          priority: 'medium'
        })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding exam:', error)
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExams(exams.filter((exam) => exam.id !== examId))
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
    }
  }

  const selectedDateExams = exams.filter((exam) => {
    if (!date) return false
    const examDate = new Date(exam.examDate)
    return (
      examDate.getDate() === date.getDate() &&
      examDate.getMonth() === date.getMonth() &&
      examDate.getFullYear() === date.getFullYear()
    )
  })

  const upcomingExams = exams
    .filter((exam) => new Date(exam.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 5)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Exam Calendar</h2>
            <p className="text-sm text-muted-foreground">
              Schedule and track your exams
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exam
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-6">
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Exam</CardTitle>
                <CardDescription>Schedule a new exam date</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddExam} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Exam Title *</label>
                      <Input
                        placeholder="e.g., Mathematics Final"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="e.g., Mathematics"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Add notes about the exam..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time *</label>
                      <Input
                        type="time"
                        value={formData.examTime}
                        onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (min)</label>
                      <Input
                        type="number"
                        placeholder="e.g., 120"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Add Exam</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Select a date to view exams</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Upcoming Exams */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Exams</CardTitle>
                <CardDescription>Next 5 scheduled exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingExams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming exams</p>
                  ) : (
                    upcomingExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{exam.title}</h4>
                            {exam.subject && (
                              <p className="text-xs text-muted-foreground">{exam.subject}</p>
                            )}
                          </div>
                          <Badge variant={getPriorityColor(exam.priority)}>
                            {exam.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(exam.examDate).toLocaleDateString()}
                          <Clock className="h-3 w-3 ml-2" />
                          {new Date(exam.examDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Exams */}
          {date && selectedDateExams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Exams on {date.toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedDateExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{exam.title}</h4>
                          <Badge variant={getPriorityColor(exam.priority)}>
                            {exam.priority}
                          </Badge>
                        </div>
                        {exam.subject && (
                          <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        )}
                        {exam.description && (
                          <p className="text-sm">{exam.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(exam.examDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {exam.duration && (
                            <div>Duration: {exam.duration} min</div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
