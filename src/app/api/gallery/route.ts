import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const items = await db.projectGallery.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Error fetching gallery items:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data galeri' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, comment, imageUrl, sortOrder, isActive } = body

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Judul proyek dan gambar wajib diisi' },
        { status: 400 }
      )
    }

    const item = await db.projectGallery.create({
      data: {
        title: title.trim(),
        comment: comment ? comment.trim() : null,
        imageUrl: imageUrl.trim(),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan item galeri' },
      { status: 500 }
    )
  }
}
