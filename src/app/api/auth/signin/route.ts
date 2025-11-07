import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('[Signin] Starting signin process...')
    const body = await request.json()
    const { email, password } = body
    console.log('[Signin] Email:', email)

    // Validate input
    if (!email || !password) {
      console.log('[Signin] Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    console.log('[Signin] Looking up user in database...')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.log('[Signin] User not found')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    console.log('[Signin] User found:', user.id)

    // Verify password
    console.log('[Signin] Verifying password...')
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      console.log('[Signin] Invalid password')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    console.log('[Signin] Password valid')

    // Create session
    console.log('[Signin] Creating session...')
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
    console.log('[Signin] Session created successfully')

    // Return user data (without password)
    return NextResponse.json(
      {
        message: 'Signed in successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Signin] ERROR:', error)
    console.error('[Signin] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Signin] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Signin] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error. Check server logs.' },
      { status: 500 }
    )
  }
}
