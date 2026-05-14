import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; kId: string }>
}

// GET: Get a single kuitansi with items
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, kId } = await context.params

    const kuitansi = await db.kuitansi.findFirst({
      where: { id: kId, projectId },
      include: { items: true },
    })

    if (!kuitansi) {
      return NextResponse.json(
        { success: false, error: 'Kuitansi not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: kuitansi })
  } catch (error) {
    console.error('Error fetching kuitansi:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kuitansi' },
      { status: 500 }
    )
  }
}

// PUT: Update a kuitansi
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, kId } = await context.params
    const body = await request.json()
    const { invoiceId, bastId, kuitansiNumber, date, amount, paymentMethod, notes, items } = body

    const existing = await db.kuitansi.findFirst({
      where: { id: kId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kuitansi not found' },
        { status: 404 }
      )
    }

    // If items are provided, delete old and create new
    if (Array.isArray(items)) {
      await db.kuitansiItem.deleteMany({ where: { kuitansiId: kId } })
    }

    const kuitansi = await db.kuitansi.update({
      where: { id: kId },
      data: {
        ...(invoiceId !== undefined && { invoiceId: invoiceId || null }),
        ...(bastId !== undefined && { bastId: bastId || null }),
        ...(kuitansiNumber !== undefined && { kuitansiNumber }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(notes !== undefined && { notes }),
        ...(Array.isArray(items) && {
          items: {
            create: items.map((item: Record<string, unknown>) => ({
              description: (item.description as string) || '',
              amount: Number(item.amount) || 0,
              notes: (item.notes as string) || null,
            })),
          },
        }),
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: kuitansi })
  } catch (error) {
    console.error('Error updating kuitansi:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update kuitansi' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a kuitansi
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, kId } = await context.params

    const existing = await db.kuitansi.findFirst({
      where: { id: kId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kuitansi not found' },
        { status: 404 }
      )
    }

    await db.kuitansi.delete({ where: { id: kId } })

    return NextResponse.json({ success: true, message: 'Kuitansi deleted' })
  } catch (error) {
    console.error('Error deleting kuitansi:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete kuitansi' },
      { status: 500 }
    )
  }
}
