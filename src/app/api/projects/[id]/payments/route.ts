import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all payments from client for this project
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const payments = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectPayment"
      WHERE "projectId" = ${projectId}
      ORDER BY "date" ASC, "createdAt" ASC
    `

    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error('Error fetching client payments:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pembayaran klien' },
      { status: 500 }
    )
  }
}

// POST: Add client payment (Lunas / Termin)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const {
      type = 'LUNAS',
      terminNo = null,
      title,
      amount,
      date,
      paymentMethod = 'TRANSFER',
      invoiceNumber = null,
      invoiceUrl = null,
      proofUrl = null,
      notes = null,
    } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal pembayaran wajib diisi dan harus lebih dari 0' },
        { status: 400 }
      )
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proyek tidak ditemukan' },
        { status: 404 }
      )
    }

    const id = 'pay_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const paymentTitle = title?.trim() || (type === 'TERMIN' ? `Pembayaran Termin ${terminNo || 1}` : 'Pembayaran Pelunasan')
    const paymentDate = date ? new Date(date) : new Date()
    const numAmount = Number(amount)
    const parsedTerminNo = terminNo ? Number(terminNo) : null

    await db.$executeRaw`
      INSERT INTO "ProjectPayment" (
        "id", "projectId", "type", "terminNo", "title", "amount", "date",
        "paymentMethod", "invoiceNumber", "invoiceUrl", "proofUrl", "notes",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${projectId}, ${type}, ${parsedTerminNo}, ${paymentTitle}, ${numAmount}, ${paymentDate},
        ${paymentMethod}, ${invoiceNumber}, ${invoiceUrl}, ${proofUrl}, ${notes},
        NOW(), NOW()
      )
    `

    // Optional: Jika ini pembayaran lunas atau total pembayaran sudah >= nilai PO, status proyek bisa otomatis di-check atau diinformasikan
    const payments = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectPayment" WHERE "id" = ${id}
    `

    return NextResponse.json({ success: true, data: payments[0] })
  } catch (error) {
    console.error('Error creating client payment:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat pembayaran klien' },
      { status: 500 }
    )
  }
}
