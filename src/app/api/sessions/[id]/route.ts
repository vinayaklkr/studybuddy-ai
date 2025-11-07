import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.chatSession.findUnique({
      where: {
        id,
      },
      include: {
        document: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    // Get the chat session to verify ownership
    const chatSession = await prisma.chatSession.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this session
    if (chatSession.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own sessions' },
        { status: 403 }
      )
    }

    // Update the session with the document (can be null to remove)
    const updatedSession = await prisma.chatSession.update({
      where: { id },
      data: { documentId: documentId === null ? null : documentId },
      include: {
        document: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the chat session to verify ownership
    const chatSession = await prisma.chatSession.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this session
    if (chatSession.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own sessions' },
        { status: 403 }
      )
    }

    // Delete the session
    await prisma.chatSession.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
