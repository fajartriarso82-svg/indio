import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; topikId: string }>
}

// POST: Tambah item RAB ke topik
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId } = await context.params
    const body = await request.json()
    const { namaItem, satuan, volumeRencana, hargaSatuanRencana } = body

    if (!namaItem?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama item wajib diisi' }, { status: 400 })
    }
    if (volumeRencana === undefined || volumeRencana < 0) {
      return NextResponse.json({ success: false, error: 'Volume rencana tidak boleh negatif' }, { status: 400 })
    }
    if (hargaSatuanRencana === undefined || hargaSatuanRencana < 0) {
      return NextResponse.json({ success: false, error: 'Harga satuan tidak boleh negatif' }, { status: 400 })
    }

    const topik = await db.rABTopik.findFirst({
      where: { id: topikId, projectId, isDeleted: false },
    })
    if (!topik) {
      return NextResponse.json({ success: false, error: 'Topik not found' }, { status: 404 })
    }

    // Tentukan urutan
    const lastItem = await db.rABItem.findFirst({
      where: { topikId },
      orderBy: { urutan: 'desc' },
      select: { urutan: true },
    })
    const urutan = (lastItem?.urutan ?? -1) + 1

    const item = await db.rABItem.create({
      data: {
        topikId,
        namaItem: namaItem.trim(),
        satuan: satuan?.trim() || 'unit',
        volumeRencana: Number(volumeRencana),
        hargaSatuanRencana: Number(hargaSatuanRencana),
        urutan,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        jumlahRencana: item.volumeRencana * item.hargaSatuanRencana,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating RAB item:', error)
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}
