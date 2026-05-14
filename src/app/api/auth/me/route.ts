import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('staff_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }

    const session = await db.staffSession.findUnique({
      where: { token },
      include: { staff: true },
    })

    if (!session || session.expiresAt < new Date() || !session.staff.isActive) {
      // Clean up expired session
      if (session) {
        await db.staffSession.delete({ where: { id: session.id } })
      }
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      staff: {
        id: session.staff.id,
        name: session.staff.name,
        username: session.staff.username,
        role: session.staff.role,
        avatar: session.staff.avatar,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 500 }
    )
  }
}
