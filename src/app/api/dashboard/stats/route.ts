import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const token = request.cookies.get('staff_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await db.staffSession.findUnique({
      where: { token },
      include: { staff: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return dashboard stats
    const totalStaff = await db.staff.count({ where: { isActive: true } })
    const activeSessions = await db.staffSession.count({
      where: { expiresAt: { gt: new Date() } },
    })

    // Clean up expired sessions
    await db.staffSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalStaff,
        activeSessions,
        recentLogins: [], // Placeholder for future implementation
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
