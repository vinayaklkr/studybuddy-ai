import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exams = await prisma.exam.findMany({
      where: { userId: session.userId },
      orderBy: { examDate: 'asc' }
    })

    return NextResponse.json(exams, { status: 200 })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, examDate, duration, subject, priority } = body

    if (!title || !examDate) {
      return NextResponse.json(
        { error: 'Title and exam date are required' },
        { status: 400 }
      )
    }

    const exam = await prisma.exam.create({
      data: {
        userId: session.userId,
        title,
        description,
        examDate: new Date(examDate),
        duration,
        subject,
        priority: priority || 'medium',
      }
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
