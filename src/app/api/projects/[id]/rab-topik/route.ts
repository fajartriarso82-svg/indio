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

    // Hitung totals
    const topiksSummary = topiks.map((topik) => {
      const items = topik.items.map((item) => {
        const jumlahRencana = item.volumeRencana * item.hargaSatuanRencana
        const totalRealisasi = item.realisasi.reduce((sum, r) => sum + r.jumlah, 0)
        const totalRealisasiLunas = item.realisasi
          .filter((r) => r.statusBayar === 'sudah_dibayar')
          .reduce((sum, r) => sum + r.jumlah, 0)
        return {
          ...item,
          jumlahRencana,
          totalRealisasi,
          totalRealisasiLunas,
          selisih: jumlahRencana - totalRealisasi,
          persenTerserap: jumlahRencana > 0 ? (totalRealisasi / jumlahRencana) * 100 : 0,
        }
      })

      const totalRencanaTopik = items.reduce((s, i) => s + i.jumlahRencana, 0)
      const totalRealisasiTopik = items.reduce((s, i) => s + i.totalRealisasi, 0)

      return {
        ...topik,
        items,
        totalRencanaTopik,
        totalRealisasiTopik,
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
