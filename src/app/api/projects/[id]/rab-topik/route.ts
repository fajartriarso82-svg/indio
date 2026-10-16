import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Ambil semua topik RAB beserta item dan summary
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        projectCode: true,
        status: true,
        type: true,
        contractValue: true,
        ppnFromClient: true,
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    const topiks = await db.rABTopik.findMany({
      where: { projectId, isDeleted: false },
      orderBy: { urutan: 'asc' },
      include: {
        realisasi: {
          where: { isAdditional: false },
          select: {
            id: true,
            jumlah: true,
            statusBayar: true,
            vendorNama: true,
            nomorInvoice: true,
            tanggalInvoice: true,
            tanggalBayar: true,
            fileBuktiUrl: true,
            buktiBayarUrl: true,
            keterangan: true,
            createdAt: true,
            vendor: { select: { id: true, name: true } },
          },
        },
        items: {
          orderBy: { urutan: 'asc' },
          include: {
            realisasi: {
              where: { isAdditional: false },
              select: {
                id: true,
                jumlah: true,
                statusBayar: true,
                vendorNama: true,
                nomorInvoice: true,
                tanggalInvoice: true,
                tanggalBayar: true,
                fileBuktiUrl: true,
                buktiBayarUrl: true,
                keterangan: true,
                createdAt: true,
                vendor: { select: { id: true, name: true } },
              },
            },
            _count: { select: { auditLogs: true } },
          },
        },
      },
    })

    // Hitung totals & status pembayaran fleksibel
    const topiksSummary = topiks.map((topik) => {
      const items = topik.items.map((item) => {
        const jumlahRencana = item.volumeRencana * item.hargaSatuanRencana
        const totalRealisasi = item.realisasi.reduce((sum, r) => sum + r.jumlah, 0)
        const totalRealisasiLunas = item.realisasi
          .filter((r) => r.statusBayar === 'sudah_dibayar')
          .reduce((sum, r) => sum + r.jumlah, 0)
        const unpaidCount = item.realisasi.filter((r) => r.statusBayar !== 'sudah_dibayar').length

        let statusBayarItem: 'belum_ada' | 'menunggu_bayar' | 'lunas' | 'sebagian' = 'belum_ada'
        if (item.realisasi.length === 0) {
          statusBayarItem = 'belum_ada'
        } else if (unpaidCount > 0) {
          statusBayarItem = 'menunggu_bayar'
        } else if (totalRealisasiLunas >= jumlahRencana && jumlahRencana > 0) {
          statusBayarItem = 'lunas'
        } else if (totalRealisasiLunas > 0) {
          statusBayarItem = 'sebagian'
        }

        return {
          ...item,
          jumlahRencana,
          totalRealisasi,
          totalRealisasiLunas,
          unpaidCount,
          statusBayarItem,
          selisih: jumlahRencana - totalRealisasi,
          persenTerserap: jumlahRencana > 0 ? (totalRealisasi / jumlahRencana) * 100 : 0,
        }
      })

      const totalRencanaTopik = items.reduce((s, i) => s + i.jumlahRencana, 0)
      
      // Gabungkan realisasi item dan realisasi langsung topik
      const realisasiItems = items.flatMap((i) => i.realisasi)
      const realisasiTopikLangsung = topik.realisasi || []
      const semuaRealisasiTopik = [...realisasiItems, ...realisasiTopikLangsung]

      const totalRealisasiTopik = semuaRealisasiTopik.reduce((s, r) => s + r.jumlah, 0)
      const totalRealisasiLunasTopik = semuaRealisasiTopik
        .filter((r) => r.statusBayar === 'sudah_dibayar')
        .reduce((sum, r) => sum + r.jumlah, 0)
      const unpaidRealisasiTopik = semuaRealisasiTopik.filter((r) => r.statusBayar !== 'sudah_dibayar')
      const unpaidCountTopik = unpaidRealisasiTopik.length
      const totalMenungguBayarTopik = unpaidRealisasiTopik.reduce((s, r) => s + r.jumlah, 0)

      // Evaluasi apakah Topik LUNAS:
      // Syarat Lunas:
      // 1. Tidak ada request pembayaran menggantung (unpaidCountTopik === 0)
      // 2. Ada pembayaran masuk (totalRealisasiLunasTopik > 0)
      // 3. Nilai yang lunas menutup rencana (totalRealisasiLunasTopik >= totalRencanaTopik)
      //    ATAU semua item pekerjaan terbayar lunas / total realisasi lunas >= total realisasi aktual
      let statusPembayaranTopik: 'LUNAS' | 'MENUNGGU_BAYAR' | 'SEBAGIAN' | 'BELUM_DIBAYAR' = 'BELUM_DIBAYAR'

      if (unpaidCountTopik > 0) {
        statusPembayaranTopik = 'MENUNGGU_BAYAR'
      } else if (totalRealisasiLunasTopik > 0) {
        if (
          (totalRencanaTopik > 0 && totalRealisasiLunasTopik >= totalRencanaTopik) ||
          (items.length > 0 && items.every((i) => i.statusBayarItem === 'lunas' || (i.jumlahRencana > 0 && i.totalRealisasiLunas >= i.jumlahRencana))) ||
          (totalRealisasiTopik > 0 && totalRealisasiLunasTopik >= totalRealisasiTopik && items.every((i) => i.realisasi.length > 0))
        ) {
          statusPembayaranTopik = 'LUNAS'
        } else {
          statusPembayaranTopik = 'SEBAGIAN'
        }
      } else {
        statusPembayaranTopik = 'BELUM_DIBAYAR'
      }

      return {
        ...topik,
        items,
        realisasiLangsung: realisasiTopikLangsung,
        totalRencanaTopik,
        totalRealisasiTopik,
        totalRealisasiLunasTopik,
        totalMenungguBayarTopik,
        unpaidCountTopik,
        statusPembayaranTopik,
        selisihTopik: totalRencanaTopik - totalRealisasiTopik,
      }
    })

    const totalRABRencana = topiksSummary.reduce((s, t) => s + t.totalRencanaTopik, 0)
    const totalRABRealisasi = topiksSummary.reduce((s, t) => s + t.totalRealisasiTopik, 0)

    return NextResponse.json({
      success: true,
      data: {
        project,
        topiks: topiksSummary,
        summary: {
          totalRABRencana,
          totalRABRealisasi,
          selisih: totalRABRencana - totalRABRealisasi,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching RAB topiks:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch RAB data' }, { status: 500 })
  }
}

// POST: Buat topik baru
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { nama } = body

    if (!nama?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama topik wajib diisi' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Tentukan urutan berikutnya
    const lastTopik = await db.rABTopik.findFirst({
      where: { projectId, isDeleted: false },
      orderBy: { urutan: 'desc' },
      select: { urutan: true },
    })
    const urutan = (lastTopik?.urutan ?? -1) + 1

    const topik = await db.rABTopik.create({
      data: { projectId, nama: nama.trim(), urutan },
    })

    return NextResponse.json({ success: true, data: topik }, { status: 201 })
  } catch (error) {
    console.error('Error creating RAB topik:', error)
    return NextResponse.json({ success: false, error: 'Failed to create topik' }, { status: 500 })
  }
}
