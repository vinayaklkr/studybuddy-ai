import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAnswer, generateTitle } from '@/lib/openai'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  console.log('\n=== CHAT API REQUEST ===')
  console.log('[Chat API] Timestamp:', new Date().toISOString())

  try {
    console.log('[Chat API] Getting user session...')
    const userSession = await getSession()
    if (!userSession) {
      console.log('[Chat API] No user session found - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Chat API] User session found:', userSession.userId)

    const { sessionId, message, documentId } = await request.json()
    console.log('[Chat API] Request data:', { sessionId, messageLength: message?.length, documentId })

    if (!sessionId || !message) {
      console.log('[Chat API] Missing required fields')
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Get session with document and previous messages
    console.log('[Chat API] Fetching chat session from database...')
    let session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        document: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Last 10 messages for context
        },
      },
    })

    if (!session) {
      console.log('[Chat API] Session not found:', sessionId)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    console.log('[Chat API] Session found:', {
      sessionId: session.id,
      hasDocument: !!session.document,
      messageCount: session.messages.length
    })

    if (session.userId !== userSession.userId) {
      console.log('[Chat API] User does not own this session - Forbidden')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If documentId is provided and session doesn't have a document, attach it
    if (documentId && !session.documentId) {
      console.log('[Chat API] Attaching document to session:', documentId)

      // Verify the document belongs to the user
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: userSession.userId
        }
      })

      if (document) {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { documentId: documentId }
        })

        session.document = document
        session.documentId = documentId
        console.log('[Chat API] Document attached successfully')
      } else {
        console.log('[Chat API] Document not found or unauthorized:', documentId)
      }
    }

    // Save user message
    console.log('[Chat API] Saving user message to database...')
    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    })
    console.log('[Chat API] User message saved:', userMessage.id)

    // Prepare conversation history
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    console.log('[Chat API] Prepared conversation history:', conversationHistory.length, 'messages')

    // Generate AI response
    const documentContent = session.document?.content || null
    console.log('[Chat API] Generating AI response...')
    console.log('[Chat API] Document content available:', !!documentContent)
    if (documentContent) {
      console.log('[Chat API] PDF Content length:', documentContent.length, 'characters')
      console.log('[Chat API] PDF Title:', session.document?.title)
      console.log('[Chat API] PDF Preview (first 200 chars):', documentContent.substring(0, 200))
    } else {
      console.log('[Chat API] No PDF context - answering from general knowledge')
    }

    const aiResponse = await generateAnswer(
      message,
      documentContent,
      conversationHistory
    )
    console.log('[Chat API] AI response generated, length:', aiResponse.length)

    // Save AI message
    console.log('[Chat API] Saving AI message to database...')
    const assistantMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse,
      },
    })
    console.log('[Chat API] AI message saved:', assistantMessage.id)

    // Update session title if this is the first message
    if (session.messages.length === 0) {
      console.log('[Chat API] First message in session, generating title...')
      const title = await generateTitle(message)
      console.log('[Chat API] Generated title:', title)
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
      })
      console.log('[Chat API] Session title updated')
    }

    // Update session's updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    // Update progress - track question answered
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.progress.upsert({
      where: {
        userId_date: {
          userId: userSession.userId,
          date: today
        }
      },
      create: {
        userId: userSession.userId,
        date: today,
        questionsAnswered: 1,
      },
      update: {
        questionsAnswered: { increment: 1 },
      }
    })

    console.log('[Chat API] Request completed successfully')
    console.log('=== END CHAT API REQUEST ===\n')

    return NextResponse.json({
      userMessage,
      assistantMessage,
    })
  } catch (error) {
    console.error('\n!!! CHAT API ERROR !!!')
    console.error('[Chat API] Error type:', error?.constructor?.name)
    console.error('[Chat API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[Chat API] Stack trace:', error instanceof Error ? error.stack : 'No stack')
    console.error('=== END CHAT API REQUEST (ERROR) ===\n')

    const errorMessage = error instanceof Error ? error.message : 'Failed to process message'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
