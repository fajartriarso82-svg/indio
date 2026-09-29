import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; realisasiId: string }>
}

// PUT: Update realisasi (status bayar, bukti bayar, upload invoice)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, realisasiId } = await context.params
    const body = await request.json()
    const {
      vendorId,
      vendorNama,
      nomorInvoice,
      tanggalInvoice,
      jumlah,
      keterangan,
      kenaPPN,
      persenPPN,
      statusBayar,
      tanggalBayar,
      fileBuktiUrl,
      buktiBayarUrl,
      kategoriAdditional,
    } = body

    const realisasi = await db.rABRealisasi.findFirst({
      where: { id: realisasiId, projectId },
    })
    if (!realisasi) {
      return NextResponse.json({ success: false, error: 'Realisasi not found' }, { status: 404 })
    }

    const updated = await db.rABRealisasi.update({
      where: { id: realisasiId },
      data: {
        ...(vendorId !== undefined ? { vendorId: vendorId || null } : {}),
        ...(vendorNama !== undefined ? { vendorNama: vendorNama || null } : {}),
        ...(nomorInvoice !== undefined ? { nomorInvoice: nomorInvoice || null } : {}),
        ...(tanggalInvoice !== undefined ? { tanggalInvoice: new Date(tanggalInvoice) } : {}),
        ...(jumlah !== undefined ? { jumlah: Number(jumlah) } : {}),
        ...(keterangan !== undefined ? { keterangan: keterangan || null } : {}),
        ...(kenaPPN !== undefined ? { kenaPPN: Boolean(kenaPPN) } : {}),
        ...(persenPPN !== undefined ? { persenPPN: Number(persenPPN) } : {}),
        ...(statusBayar !== undefined ? { statusBayar } : {}),
        ...(tanggalBayar !== undefined ? { tanggalBayar: tanggalBayar ? new Date(tanggalBayar) : null } : {}),
        ...(fileBuktiUrl !== undefined ? { fileBuktiUrl: fileBuktiUrl || null } : {}),
        ...(buktiBayarUrl !== undefined ? { buktiBayarUrl: buktiBayarUrl || null } : {}),
        ...(kategoriAdditional !== undefined ? { kategoriAdditional: kategoriAdditional || null } : {}),
      },
      include: {
        rabItem: { select: { id: true, namaItem: true, topik: { select: { nama: true } } } },
        vendor: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating RAB realisasi:', error)
    return NextResponse.json({ success: false, error: 'Failed to update realisasi' }, { status: 500 })
  }
}

// DELETE: Hapus entri realisasi
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, realisasiId } = await context.params

    const realisasi = await db.rABRealisasi.findFirst({
      where: { id: realisasiId, projectId },
    })
    if (!realisasi) {
      return NextResponse.json({ success: false, error: 'Realisasi not found' }, { status: 404 })
    }

    await db.rABRealisasi.delete({ where: { id: realisasiId } })

    return NextResponse.json({ success: true, message: 'Realisasi dihapus' })
  } catch (error) {
    console.error('Error deleting RAB realisasi:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete realisasi' }, { status: 500 })
  }
}
