import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/projects/stats
 *
 * Ringkasan proyek untuk DashboardHome:
 * - activeProjects : proyek yang masih DRAFT / IN_PROGRESS
 * - totalClients   : jumlah seluruh klien
 * - totalVendors   : jumlah seluruh vendor
 * - pendingInvoices: invoice yang belum lunas (UNPAID / PARTIAL)
 *
 * Catatan: route statis ini menang atas dynamic segment `/api/projects/[id]`,
 * sehingga permintaan "stats" tidak lagi dianggap sebagai project id.
 */
export async function GET() {
  try {
    const [
      activeProjects,
      totalClients,
      totalVendors,
      pendingInvoices,
      unpaidVendorInvoices,
      hutangVendorAggregate,
    ] = await Promise.all([
      db.project.count({ where: { status: { in: ['DRAFT', 'IN_PROGRESS'] } } }),
      db.client.count(),
      db.vendor.count(),
      db.invoice.count({ where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
      db.rABRealisasi.count({ where: { statusBayar: 'belum_dibayar' } }),
      db.rABRealisasi.aggregate({
        where: { statusBayar: 'belum_dibayar' },
        _sum: { jumlah: true },
      }),
    ])

    const totalHutangVendor = hutangVendorAggregate._sum.jumlah || 0

    return NextResponse.json({
      success: true,
      stats: {
        activeProjects,
        totalClients,
        totalVendors,
        pendingInvoices,
        unpaidVendorInvoices,
        totalHutangVendor,
      },
    })
  } catch (error) {
    console.error('Error fetching project stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project stats' },
      { status: 500 }
    )
  }
}