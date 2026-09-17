import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('staff_token')?.value

    if (!token) {
      // Session probe: "belum login" bukan error. Mengembalikan 200 di sini
      // mencegah browser mencatat "Failed to load resource: 401" di console
      // pada setiap kunjungan publik (landing page).
      return NextResponse.json({ success: true, authenticated: false })
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
      return NextResponse.json({ success: true, authenticated: false })
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
