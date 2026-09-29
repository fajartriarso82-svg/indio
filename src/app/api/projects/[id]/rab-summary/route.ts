import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Ringkasan untung-rugi proyek (RAB Rencana vs Realisasi)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        projectCode: true,
        type: true,
        status: true,
        contractValue: true,
        ppnFromClient: true,
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Ambil semua topik dan item (termasuk realisasi)
    const topiks = await db.rABTopik.findMany({
      where: { projectId, isDeleted: false },
      orderBy: { urutan: 'asc' },
      include: {
        items: {
          orderBy: { urutan: 'asc' },
          include: {
            realisasi: {
              where: { isAdditional: false },
              select: { jumlah: true, statusBayar: true, kenaPPN: true, persenPPN: true },
            },
          },
        },
      },
    })

    // Ambil semua biaya tambahan (additional costs) — dari RABRealisasi dengan isAdditional=true
    const additionalCosts = await db.rABRealisasi.findMany({
      where: { projectId, isAdditional: true },
      select: {
        id: true,
        jumlah: true,
        statusBayar: true,
        kategoriAdditional: true,
        vendorNama: true,
        tanggalInvoice: true,
        keterangan: true,
      },
    })

    // Hitung per topik
    const topiksSummary = topiks.map((topik) => {
      const items = topik.items.map((item) => {
        const jumlahRencana = item.volumeRencana * item.hargaSatuanRencana
        const totalRealisasi = item.realisasi.reduce((sum, r) => sum + r.jumlah, 0)
        const totalLunas = item.realisasi.filter(r => r.statusBayar === 'sudah_dibayar').reduce((s, r) => s + r.jumlah, 0)
        const totalBelumBayar = item.realisasi.filter(r => r.statusBayar === 'belum_dibayar').reduce((s, r) => s + r.jumlah, 0)
        return {
          id: item.id,
          namaItem: item.namaItem,
          satuan: item.satuan,
          volumeRencana: item.volumeRencana,
          hargaSatuanRencana: item.hargaSatuanRencana,
          jumlahRencana,
          totalRealisasi,
          totalLunas,
          totalBelumBayar,
          selisih: jumlahRencana - totalRealisasi,
          persenTerserap: jumlahRencana > 0 ? (totalRealisasi / jumlahRencana) * 100 : 0,
          isOverBudget: totalRealisasi > jumlahRencana,
        }
      })

      const totalRencanaTopik = items.reduce((s, i) => s + i.jumlahRencana, 0)
      const totalRealisasiTopik = items.reduce((s, i) => s + i.totalRealisasi, 0)
      const totalLunasTopik = items.reduce((s, i) => s + i.totalLunas, 0)

      return {
        id: topik.id,
        nama: topik.nama,
        items,
        totalRencanaTopik,
        totalRealisasiTopik,
        totalLunasTopik,
        selisihTopik: totalRencanaTopik - totalRealisasiTopik,
        isOverBudget: totalRealisasiTopik > totalRencanaTopik,
      }
    })

    const totalRABRencana = topiksSummary.reduce((s, t) => s + t.totalRencanaTopik, 0)
    const totalRABRealisasi = topiksSummary.reduce((s, t) => s + t.totalRealisasiTopik, 0)
    const totalRABLunas = topiksSummary.reduce((s, t) => s + t.totalLunasTopik, 0)
    const totalAdditional = additionalCosts.reduce((s, c) => s + c.jumlah, 0)
    const totalPengeluaranAktual = totalRABRealisasi + totalAdditional

    // Kalkulasi margin
    // contractValue = nilai tagihan ke klien (ex. atau inc. PPN tergantung ppnFromClient)
    const contractValue = project.contractValue ?? 0

    // Margin rencana = nilai kontrak − total RAB rencana
    const marginRencana = contractValue - totalRABRencana
    // Margin aktual = nilai kontrak − total pengeluaran aktual (realisasi + additional)
    const marginAktual = contractValue - totalPengeluaranAktual

    // Invoice vendor yang belum dibayar (hutang ke vendor)
    const hutangVendor = topiksSummary.reduce((s, t) =>
      s + t.items.reduce((si, i) => si + i.totalBelumBayar, 0), 0
    )

    return NextResponse.json({
      success: true,
      data: {
        project,
        topiksSummary,
        additionalCosts,
        summary: {
          contractValue,
          ppnFromClient: project.ppnFromClient,
          totalRABRencana,
          totalRABRealisasi,
          totalRABLunas,
          totalAdditional,
          totalPengeluaranAktual,
          marginRencana,
          marginAktual,
          hutangVendor,
          persenTerserap: totalRABRencana > 0 ? (totalRABRealisasi / totalRABRencana) * 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching RAB summary:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch summary' }, { status: 500 })
  }
}
