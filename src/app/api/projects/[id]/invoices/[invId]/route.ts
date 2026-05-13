import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; invId: string }>
}

// GET: Get a single invoice with items and termins
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, invId } = await context.params

    const invoice = await db.invoice.findFirst({
      where: { id: invId, projectId },
      include: {
        items: true,
        termins: { orderBy: { terminNo: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT: Update an invoice
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, invId } = await context.params
    const body = await request.json()
    const { invoiceNumber, date, dueDate, paymentMethod, status, notes, items, termins } = body

    const existing = await db.invoice.findFirst({
      where: { id: invId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // If items are provided, delete old and create new
    if (Array.isArray(items)) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: invId } })
    }

    // If termins are provided, delete old and create new
    if (Array.isArray(termins)) {
      await db.invoiceTermin.deleteMany({ where: { invoiceId: invId } })
    }

    const invoice = await db.invoice.update({
      where: { id: invId },
      data: {
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(status !== undefined && { status }),
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
        ...(Array.isArray(termins) && {
          termins: {
            create: termins.map((termin: Record<string, unknown>) => ({
              terminNo: Number(termin.terminNo) || 0,
              percentage: Number(termin.percentage) || 0,
              amount: Number(termin.amount) || 0,
              dueDate: termin.dueDate ? new Date(termin.dueDate as string) : null,
              status: (termin.status as string) || 'UNPAID',
              paidAt: termin.paidAt ? new Date(termin.paidAt as string) : null,
              notes: (termin.notes as string) || null,
            })),
          },
        }),
      },
      include: {
        items: true,
        termins: { orderBy: { terminNo: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE: Delete an invoice
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, invId } = await context.params

    const existing = await db.invoice.findFirst({
      where: { id: invId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    await db.invoice.delete({ where: { id: invId } })

    return NextResponse.json({ success: true, message: 'Invoice deleted' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
