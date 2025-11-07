import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('Database URL not configured')
      return NextResponse.json(
        { error: 'Database not configured. Please set up DATABASE_URL in .env.local' },
        { status: 500 }
      )
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sessions: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check if it's a database connection error
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Cannot connect to database. Please check your DATABASE_URL and ensure migrations are run.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: `Failed to fetch documents: ${errorMessage}` },
      { status: 500 }
    )
  }
}
