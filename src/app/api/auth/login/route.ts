import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, rehashIfNeeded } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 400 }
      )
    }

    // Find staff member
    const staff = await db.staff.findUnique({
      where: { username },
    })

    // Same error for unknown user and wrong password (prevents user enumeration)
    if (!staff || !staff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password (bcrypt, with legacy SHA-256 fallback)
    const valid = await verifyPassword(password, staff.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Upgrade legacy SHA-256 hash to bcrypt transparently
    const newHash = await rehashIfNeeded(password, staff.passwordHash)
    if (newHash) {
      await db.staff.update({
        where: { id: staff.id },
        data: { passwordHash: newHash },
      })
    }

    // Create session token
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

    await db.staffSession.create({
      data: {
        token,
        staffId: staff.id,
        expiresAt,
      },
    })

    // Update last login
    await db.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    })

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        avatar: staff.avatar,
      },
    })

    response.cookies.set('staff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
