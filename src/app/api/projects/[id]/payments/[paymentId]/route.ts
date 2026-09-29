import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; paymentId: string }>
}

// DELETE: Hapus catatan pembayaran klien
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, paymentId } = await context.params

    await db.$executeRaw`
      DELETE FROM "ProjectPayment"
      WHERE "id" = ${paymentId} AND "projectId" = ${projectId}
    `

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting client payment:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pembayaran klien' },
      { status: 500 }
    )
  }
}
