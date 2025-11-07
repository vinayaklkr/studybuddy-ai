import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get progress data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const progress = await prisma.progress.findMany({
      where: {
        userId: session.userId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate stats
    const totalStudyTime = progress.reduce((sum, p) => sum + p.studyTime, 0)
    const totalDocuments = progress.reduce((sum, p) => sum + p.documentsRead, 0)
    const totalQuestions = progress.reduce((sum, p) => sum + p.questionsAnswered, 0)
    const totalSessions = progress.reduce((sum, p) => sum + p.focusSessions, 0)
    const avgStudyTime = progress.length > 0 ? Math.floor(totalStudyTime / progress.length) : 0

    // Calculate streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Sort progress by date descending
    const sortedProgress = [...progress].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const checkDate = new Date(today)
    for (const p of sortedProgress) {
      const progressDate = new Date(p.date)
      progressDate.setHours(0, 0, 0, 0)

      if (progressDate.getTime() === checkDate.getTime() && p.studyTime > 0) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (progressDate.getTime() < checkDate.getTime()) {
        break
      }
    }

    const stats = {
      totalStudyTime,
      totalDocuments,
      totalQuestions,
      totalSessions,
      avgStudyTime,
      currentStreak,
    }

    return NextResponse.json({ progress, stats }, { status: 200 })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
