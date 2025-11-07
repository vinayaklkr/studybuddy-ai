import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const studySession = await prisma.studySession.findUnique({
      where: { id }
    })

    if (!studySession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    if (studySession.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { completed, duration } = body

    const updatedSession = await prisma.studySession.update({
      where: { id },
      data: {
        completed: completed !== undefined ? completed : studySession.completed,
        duration: duration !== undefined ? duration : studySession.duration,
        endTime: completed ? new Date() : studySession.endTime,
      }
    })

    // If session is completed, update progress
    if (completed && duration) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.progress.upsert({
        where: {
          userId_date: {
            userId: session.userId,
            date: today
          }
        },
        create: {
          userId: session.userId,
          date: today,
          studyTime: duration,
          focusSessions: studySession.focusMode ? 1 : 0,
        },
        update: {
          studyTime: { increment: duration },
          focusSessions: studySession.focusMode ? { increment: 1 } : undefined,
        }
      })
    }

    return NextResponse.json(updatedSession, { status: 200 })
  } catch (error) {
    console.error('Error updating study session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
