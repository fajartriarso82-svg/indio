import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; topikId: string }>
}

// POST: Bayar total atau lunasi semua tagihan di level Topik
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, topikId } = await context.params
    const body = await request.json()
    const {
      mode = 'BAYAR_TOPIK', // 'BAYAR_TOPIK' | 'LUNASI_SEMUA_REQUEST'
      jumlah,
      vendorId,
      vendorNama,
      nomorInvoice,
      tanggalInvoice,
      tanggalBayar,
      statusBayar = 'sudah_dibayar',
      fileBuktiUrl,
      buktiBayarUrl,
      keterangan,
      tandaiSemuaItemLunas = false,
    } = body

    const topik = await db.rABTopik.findFirst({
      where: { id: topikId, projectId, isDeleted: false },
      include: {
        items: {
          include: {
            realisasi: true,
          },
        },
      },
    })

    if (!topik) {
      return NextResponse.json({ success: false, error: 'Topik tidak ditemukan' }, { status: 404 })
    }

    if (mode === 'LUNASI_SEMUA_REQUEST') {
      // Ambil semua realisasi belum dibayar di topik ini (baik direct maupun via item)
      const itemIds = topik.items.map((i) => i.id)

      const updated = await db.rABRealisasi.updateMany({
        where: {
          OR: [
            { rabTopikId: topikId, statusBayar: 'belum_dibayar' },
            { rabItemId: { in: itemIds }, statusBayar: 'belum_dibayar' },
          ],
        },
        data: {
          statusBayar: 'sudah_dibayar',
          tanggalBayar: tanggalBayar ? new Date(tanggalBayar) : new Date(),
          ...(buktiBayarUrl ? { buktiBayarUrl } : {}),
          ...(keterangan ? { keterangan } : {}),
        },
      })

      return NextResponse.json({
        success: true,
        message: `${updated.count} tagihan dalam topik berhasil dilunasi.`,
        updatedCount: updated.count,
      })
    }

    // Mode BAYAR_TOPIK: Buat transaksi realisasi langsung di level Topik
    if (!jumlah || Number(jumlah) <= 0) {
      return NextResponse.json({ success: false, error: 'Nominal pembayaran harus lebih dari 0' }, { status: 400 })
    }

    const isPaid = statusBayar === 'sudah_dibayar'

    const realisasi = await db.$transaction(async (tx) => {
      const entry = await tx.rABRealisasi.create({
        data: {
          projectId,
          rabTopikId: topikId,
          rabItemId: null,
          vendorId: vendorId || null,
          vendorNama: vendorNama || null,
          nomorInvoice: nomorInvoice || null,
          tanggalInvoice: tanggalInvoice ? new Date(tanggalInvoice) : new Date(),
          jumlah: Number(jumlah),
          keterangan: keterangan || 'Pembayaran Langsung Level Topik',
          statusBayar: isPaid ? 'sudah_dibayar' : 'belum_dibayar',
          tanggalBayar: isPaid ? (tanggalBayar ? new Date(tanggalBayar) : new Date()) : null,
          fileBuktiUrl: fileBuktiUrl || null,
          buktiBayarUrl: isPaid ? (buktiBayarUrl || null) : null,
          isAdditional: false,
        },
      })

      // Jika user memilih untuk menandai juga request-request yang menggantung menjadi lunas
      if (tandaiSemuaItemLunas && isPaid) {
        const itemIds = topik.items.map((i) => i.id)
        await tx.rABRealisasi.updateMany({
          where: {
            rabItemId: { in: itemIds },
            statusBayar: 'belum_dibayar',
          },
          data: {
            statusBayar: 'sudah_dibayar',
            tanggalBayar: tanggalBayar ? new Date(tanggalBayar) : new Date(),
            ...(buktiBayarUrl ? { buktiBayarUrl } : {}),
          },
        })
      }

      return entry
    })

    return NextResponse.json({
      success: true,
      data: realisasi,
      message: 'Pembayaran topik berhasil dicatat.',
    })
  } catch (error) {
    console.error('Error recording topik payment:', error)
    return NextResponse.json({ success: false, error: 'Gagal memproses pembayaran topik' }, { status: 500 })
  }
}
