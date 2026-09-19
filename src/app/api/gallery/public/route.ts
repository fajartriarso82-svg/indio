import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.projectGallery.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        comment: true,
        imageUrl: true,
        sortOrder: true,
      },
    })
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Error fetching public gallery items:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat galeri' },
      { status: 500 }
    )
  }
}
