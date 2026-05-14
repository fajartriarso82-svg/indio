import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; sjId: string }>
}

// GET: Get a single surat jalan with items
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, sjId } = await context.params

    const suratJalan = await db.suratJalan.findFirst({
      where: { id: sjId, projectId },
      include: { items: true },
    })

    if (!suratJalan) {
      return NextResponse.json(
        { success: false, error: 'Surat jalan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: suratJalan })
  } catch (error) {
    console.error('Error fetching surat jalan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surat jalan' },
      { status: 500 }
    )
  }
}

// PUT: Update a surat jalan
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, sjId } = await context.params
    const body = await request.json()
    const { sjNumber, date, type, notes, checkerName, driverName, items } = body

    const existing = await db.suratJalan.findFirst({
      where: { id: sjId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Surat jalan not found' },
        { status: 404 }
      )
    }

    // If items are provided, delete old and create new
    if (Array.isArray(items)) {
      await db.suratJalanItem.deleteMany({ where: { suratJalanId: sjId } })
    }

    const suratJalan = await db.suratJalan.update({
      where: { id: sjId },
      data: {
        ...(sjNumber !== undefined && { sjNumber }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(type !== undefined && { type }),
        ...(notes !== undefined && { notes }),
        ...(checkerName !== undefined && { checkerName }),
        ...(driverName !== undefined && { driverName }),
        ...(Array.isArray(items) && {
          items: {
            create: items.map((item: Record<string, unknown>) => ({
              description: (item.description as string) || '',
              qty: Number(item.qty) || 0,
              unit: (item.unit as string) || '',
              notes: (item.notes as string) || null,
            })),
          },
        }),
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: suratJalan })
  } catch (error) {
    console.error('Error updating surat jalan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update surat jalan' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a surat jalan
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, sjId } = await context.params

    const existing = await db.suratJalan.findFirst({
      where: { id: sjId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Surat jalan not found' },
        { status: 404 }
      )
    }

    await db.suratJalan.delete({ where: { id: sjId } })

    return NextResponse.json({ success: true, message: 'Surat jalan deleted' })
  } catch (error) {
    console.error('Error deleting surat jalan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete surat jalan' },
      { status: 500 }
    )
  }
}
