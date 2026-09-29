import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; topikId: string }>
}

// PUT: Edit topik (nama, urutan)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId } = await context.params
    const body = await request.json()
    const { nama, urutan } = body

    const topik = await db.rABTopik.findFirst({
      where: { id: topikId, projectId, isDeleted: false },
    })
    if (!topik) {
      return NextResponse.json({ success: false, error: 'Topik not found' }, { status: 404 })
    }

    const updated = await db.rABTopik.update({
      where: { id: topikId },
      data: {
        ...(nama !== undefined ? { nama: nama.trim() } : {}),
        ...(urutan !== undefined ? { urutan: Number(urutan) } : {}),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating RAB topik:', error)
    return NextResponse.json({ success: false, error: 'Failed to update topik' }, { status: 500 })
  }
}

// DELETE: Soft delete topik (jika masih ada item, tetap soft delete)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId } = await context.params

    const topik = await db.rABTopik.findFirst({
      where: { id: topikId, projectId, isDeleted: false },
      include: { _count: { select: { items: true } } },
    })
    if (!topik) {
      return NextResponse.json({ success: false, error: 'Topik not found' }, { status: 404 })
    }

    // Cek apakah ada realisasi terhubung ke item di topik ini
    const realisasiCount = await db.rABRealisasi.count({
      where: { rabItem: { topikId } },
    })

    if (realisasiCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Topik tidak bisa dihapus karena sudah ada ${realisasiCount} entri realisasi terkait. Hapus realisasi terlebih dahulu.`,
        },
        { status: 400 }
      )
    }

    // Soft delete topik (items akan ikut soft delete via cascade)
    await db.rABTopik.update({
      where: { id: topikId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Topik dihapus' })
  } catch (error) {
    console.error('Error deleting RAB topik:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete topik' }, { status: 500 })
  }
}
