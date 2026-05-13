import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all invoices for a project
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const invoices = await db.invoice.findMany({
      where: { projectId },
      include: {
        items: true,
        termins: { orderBy: { terminNo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST: Create an invoice
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { invoiceNumber, date, dueDate, paymentMethod, status, notes, items, termins } = body

    if (!invoiceNumber || !date || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'invoiceNumber, date, and paymentMethod are required' },
        { status: 400 }
      )
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const itemsData = Array.isArray(items)
      ? items.map((item: Record<string, unknown>) => ({
          description: (item.description as string) || '',
          amount: Number(item.amount) || 0,
          notes: (item.notes as string) || null,
        }))
      : []

    const terminsData = Array.isArray(termins)
      ? termins.map((termin: Record<string, unknown>) => ({
          terminNo: Number(termin.terminNo) || 0,
          percentage: Number(termin.percentage) || 0,
          amount: Number(termin.amount) || 0,
          dueDate: termin.dueDate ? new Date(termin.dueDate as string) : null,
          status: (termin.status as string) || 'UNPAID',
          notes: (termin.notes as string) || null,
        }))
      : []

    const invoice = await db.invoice.create({
      data: {
        projectId,
        invoiceNumber,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentMethod,
        status: status || 'UNPAID',
        notes,
        items: {
          create: itemsData,
        },
        termins: {
          create: terminsData,
        },
      },
      include: {
        items: true,
        termins: { orderBy: { terminNo: 'asc' } },
      },
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
