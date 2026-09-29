import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Semua realisasi untuk satu proyek (invoice vendor + additional)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const isAdditional = searchParams.get('additional')

    const where: Record<string, unknown> = { projectId }
    if (isAdditional === 'true') where.isAdditional = true
    else if (isAdditional === 'false') where.isAdditional = false

    const realisasi = await db.rABRealisasi.findMany({
      where,
      orderBy: { tanggalInvoice: 'desc' },
      include: {
        rabItem: {
          select: {
            id: true,
            namaItem: true,
            satuan: true,
            topik: { select: { id: true, nama: true } },
          },
        },
        vendor: { select: { id: true, name: true, isPKP: true } },
      },
    })

    return NextResponse.json({ success: true, data: realisasi })
  } catch (error) {
    console.error('Error fetching RAB realisasi:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch realisasi' }, { status: 500 })
  }
}

// POST: Tambah entri realisasi (invoice vendor atau biaya tambahan)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const {
      rabItemId,
      vendorId,
      vendorNama,
      nomorInvoice,
      tanggalInvoice,
      jumlah,
      keterangan,
      kenaPPN,
      persenPPN,
      statusBayar = 'belum_dibayar',
      tanggalBayar,
      fileBuktiUrl,
      buktiBayarUrl,
      isAdditional,
      kategoriAdditional,
    } = body

    if (!jumlah || Number(jumlah) <= 0) {
      return NextResponse.json({ success: false, error: 'Jumlah/nominal harus lebih dari 0' }, { status: 400 })
    }

    // Jika bukan additional, wajib ada item RAB
    if (!isAdditional && !rabItemId) {
      return NextResponse.json({ success: false, error: 'Pilih item RAB yang direalisasi' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Jika ada rabItemId, validasi item milik proyek ini
    if (rabItemId) {
      const rabItem = await db.rABItem.findFirst({
        where: { id: rabItemId, topik: { projectId } },
      })
      if (!rabItem) {
        return NextResponse.json({ success: false, error: 'Item RAB tidak ditemukan di proyek ini' }, { status: 404 })
      }
    }

    const isPaid = statusBayar === 'sudah_dibayar'

    const realisasi = await db.rABRealisasi.create({
      data: {
        projectId,
        rabItemId: rabItemId || null,
        vendorId: vendorId || null,
        vendorNama: vendorNama || null,
        nomorInvoice: nomorInvoice || null,
        tanggalInvoice: tanggalInvoice ? new Date(tanggalInvoice) : new Date(),
        jumlah: Number(jumlah),
        keterangan: keterangan || null,
        kenaPPN: Boolean(kenaPPN),
        persenPPN: kenaPPN ? Number(persenPPN || 11) : 0,
        statusBayar: isPaid ? 'sudah_dibayar' : 'belum_dibayar',
        tanggalBayar: isPaid ? (tanggalBayar ? new Date(tanggalBayar) : new Date()) : null,
        fileBuktiUrl: fileBuktiUrl || null,
        buktiBayarUrl: isPaid ? (buktiBayarUrl || null) : null,
        isAdditional: Boolean(isAdditional),
        kategoriAdditional: isAdditional ? (kategoriAdditional || 'LAINNYA') : null,
      },
      include: {
        rabItem: { select: { id: true, namaItem: true, topik: { select: { nama: true } } } },
        vendor: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: realisasi }, { status: 201 })
  } catch (error) {
    console.error('Error creating RAB realisasi:', error)
    return NextResponse.json({ success: false, error: 'Failed to create realisasi' }, { status: 500 })
  }
}
