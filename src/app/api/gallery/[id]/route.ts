import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, comment, imageUrl, sortOrder, isActive } = body

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Judul proyek dan gambar wajib diisi' },
        { status: 400 }
      )
    }

    const item = await db.projectGallery.update({
      where: { id },
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
    console.error('Error updating gallery item:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui item galeri' },
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
    await db.projectGallery.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Item galeri berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus item galeri' },
      { status: 500 }
    )
  }
}
