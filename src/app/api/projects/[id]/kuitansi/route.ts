import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all kuitansi for a project
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

    const kuitansis = await db.kuitansi.findMany({
      where: { projectId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: kuitansis })
  } catch (error) {
    console.error('Error fetching kuitansis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kuitansis' },
      { status: 500 }
    )
  }
}

// POST: Create a kuitansi
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { invoiceId, bastId, kuitansiNumber, date, amount, paymentMethod, notes, items } = body

    if (!kuitansiNumber || !date || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'kuitansiNumber, date, and paymentMethod are required' },
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

    const kuitansi = await db.kuitansi.create({
      data: {
        projectId,
        invoiceId: invoiceId || null,
        bastId: bastId || null,
        kuitansiNumber,
        date: new Date(date),
        amount: Number(amount) || 0,
        paymentMethod,
        notes,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: kuitansi }, { status: 201 })
  } catch (error) {
    console.error('Error creating kuitansi:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create kuitansi' },
      { status: 500 }
    )
  }
}
