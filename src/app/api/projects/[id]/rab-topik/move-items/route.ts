import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST: Pindahkan item-item RAB ke topik baru atau topik yang sudah ada
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { itemIds, targetMode = 'NEW_TOPIK', newTopikNama, targetTopikId, userId } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Pilih minimal satu item untuk dipindahkan' }, { status: 400 })
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    })
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Validasi semua items milik project ini
    const items = await db.rABItem.findMany({
      where: {
        id: { in: itemIds },
        topik: { projectId, isDeleted: false },
      },
      include: {
        topik: { select: { id: true, nama: true } },
      },
    })

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Sebagian item tidak ditemukan atau tidak valid pada proyek ini' },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      let finalTopikId = targetTopikId
      let finalTopikNama = ''

      if (targetMode === 'NEW_TOPIK') {
        const trimmedNama = (newTopikNama || '').trim()
        if (!trimmedNama) {
          throw new Error('Nama topik baru wajib diisi')
        }

        // Tentukan urutan berikutnya
        const lastTopik = await tx.rABTopik.findFirst({
          where: { projectId, isDeleted: false },
          orderBy: { urutan: 'desc' },
          select: { urutan: true },
        })
        const nextUrutan = (lastTopik?.urutan ?? -1) + 1

        const createdTopik = await tx.rABTopik.create({
          data: {
            projectId,
            nama: trimmedNama,
            urutan: nextUrutan,
          },
        })
        finalTopikId = createdTopik.id
        finalTopikNama = createdTopik.nama
      } else {
        if (!targetTopikId) {
          throw new Error('Pilih topik tujuan')
        }
        const existingTopik = await tx.rABTopik.findFirst({
          where: { id: targetTopikId, projectId, isDeleted: false },
        })
        if (!existingTopik) {
          throw new Error('Topik tujuan tidak ditemukan')
        }
        finalTopikId = existingTopik.id
        finalTopikNama = existingTopik.nama
      }

      // Hitung urutan terakhir di topik tujuan
      const lastItemInTarget = await tx.rABItem.findFirst({
        where: { topikId: finalTopikId },
        orderBy: { urutan: 'desc' },
        select: { urutan: true },
      })
      let nextItemUrutan = (lastItemInTarget?.urutan ?? -1) + 1

      // Audit logs jika proyek bukan DRAFT
      const auditLogs: { rabItemId: string; fieldDiubah: string; nilaiLama: string; nilaiBaru: string; userId: string | null }[] = []

      for (const it of items) {
        if (project.status !== 'DRAFT') {
          auditLogs.push({
            rabItemId: it.id,
            fieldDiubah: 'topik',
            nilaiLama: it.topik.nama,
            nilaiBaru: finalTopikNama,
            userId: userId || null,
          })
        }

        await tx.rABItem.update({
          where: { id: it.id },
          data: {
            topikId: finalTopikId,
            urutan: nextItemUrutan++,
          },
        })
      }

      if (auditLogs.length > 0) {
        await tx.rABAuditLog.createMany({ data: auditLogs })
      }

      return {
        targetTopikId: finalTopikId,
        targetTopikNama: finalTopikNama,
        itemCount: items.length,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil memindahkan ${result.itemCount} item ke topik "${result.targetTopikNama}"`,
      data: result,
    })
  } catch (error: any) {
    console.error('Error moving RAB items:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memindahkan item' },
      { status: 500 }
    )
  }
}

