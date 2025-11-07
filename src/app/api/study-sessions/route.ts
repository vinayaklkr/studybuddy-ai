import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studySessions = await prisma.studySession.findMany({
      where: { userId: session.userId },
      orderBy: { startTime: 'desc' }
    })

    return NextResponse.json(studySessions, { status: 200 })
  } catch (error) {
    console.error('Error fetching study sessions:', error)
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
    const { title, description, focusMode } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const studySession = await prisma.studySession.create({
      data: {
        userId: session.userId,
        title,
        description,
        startTime: new Date(),
        focusMode: focusMode || false,
      }
    })

    return NextResponse.json(studySession, { status: 201 })
  } catch (error) {
    console.error('Error creating study session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
