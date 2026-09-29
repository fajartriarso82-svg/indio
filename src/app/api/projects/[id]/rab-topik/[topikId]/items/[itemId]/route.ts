import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; topikId: string; itemId: string }>
}

// PUT: Edit item RAB (dengan audit log otomatis jika proyek IN_PROGRESS)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId, itemId } = await context.params
    const body = await request.json()
    const { namaItem, satuan, volumeRencana, hargaSatuanRencana, userId } = body

    if (volumeRencana !== undefined && Number(volumeRencana) < 0) {
      return NextResponse.json({ success: false, error: 'Volume rencana tidak boleh negatif' }, { status: 400 })
    }
    if (hargaSatuanRencana !== undefined && Number(hargaSatuanRencana) < 0) {
      return NextResponse.json({ success: false, error: 'Harga satuan tidak boleh negatif' }, { status: 400 })
    }

    const item = await db.rABItem.findFirst({
      where: { id: itemId, topikId },
      include: { topik: { select: { projectId: true } } },
    })
    if (!item || item.topik.projectId !== projectId) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    // Cek status proyek untuk audit log
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    })

    const auditLogs: { fieldDiubah: string; nilaiLama: string; nilaiBaru: string; userId: string | null; rabItemId: string }[] = []

    const fieldsToTrack: { key: keyof typeof item; label: string; newValue: unknown }[] = [
      { key: 'namaItem', label: 'namaItem', newValue: namaItem },
      { key: 'satuan', label: 'satuan', newValue: satuan },
      { key: 'volumeRencana', label: 'volumeRencana', newValue: volumeRencana },
      { key: 'hargaSatuanRencana', label: 'hargaSatuanRencana', newValue: hargaSatuanRencana },
    ]

    // Jika proyek sudah IN_PROGRESS atau lebih, catat audit log
    if (project && project.status !== 'DRAFT') {
      for (const field of fieldsToTrack) {
        if (field.newValue !== undefined && String(field.newValue) !== String(item[field.key])) {
          auditLogs.push({
            rabItemId: itemId,
            fieldDiubah: field.label,
            nilaiLama: String(item[field.key]),
            nilaiBaru: String(field.newValue),
            userId: userId || null,
          })
        }
      }
    }

    // Update item
    const updated = await db.$transaction(async (tx) => {
      const updatedItem = await tx.rABItem.update({
        where: { id: itemId },
        data: {
          ...(namaItem !== undefined ? { namaItem: namaItem.trim() } : {}),
          ...(satuan !== undefined ? { satuan: satuan.trim() } : {}),
          ...(volumeRencana !== undefined ? { volumeRencana: Number(volumeRencana) } : {}),
          ...(hargaSatuanRencana !== undefined ? { hargaSatuanRencana: Number(hargaSatuanRencana) } : {}),
        },
      })

      // Simpan audit logs jika ada
      if (auditLogs.length > 0) {
        await tx.rABAuditLog.createMany({ data: auditLogs })
      }

      return updatedItem
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        jumlahRencana: updated.volumeRencana * updated.hargaSatuanRencana,
      },
      auditCount: auditLogs.length,
    })
  } catch (error) {
    console.error('Error updating RAB item:', error)
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE: Hapus item RAB
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId, itemId } = await context.params

    const item = await db.rABItem.findFirst({
      where: { id: itemId, topikId },
      include: { topik: { select: { projectId: true } }, _count: { select: { realisasi: true } } },
    })
    if (!item || item.topik.projectId !== projectId) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    if (item._count.realisasi > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Item tidak bisa dihapus karena sudah ada ${item._count.realisasi} entri realisasi. Hapus realisasi terlebih dahulu.`,
        },
        { status: 400 }
      )
    }

    await db.rABItem.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true, message: 'Item RAB dihapus' })
  } catch (error) {
    console.error('Error deleting RAB item:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 })
  }
}
