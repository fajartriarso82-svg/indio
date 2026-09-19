import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      where: { isStarred: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        notes: true,
        iconUrl: true,
        isStarred: true,
      },
    })

    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Error fetching public clients:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data klien unggulan' },
      { status: 500 }
    )
  }
}
