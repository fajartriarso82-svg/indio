import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all surat jalan for a project
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

    const suratJalans = await db.suratJalan.findMany({
      where: { projectId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: suratJalans })
  } catch (error) {
    console.error('Error fetching surat jalans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surat jalans' },
      { status: 500 }
    )
  }
}

// POST: Create a surat jalan
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { sjNumber, date, type, notes, checkerName, driverName, items } = body

    if (!sjNumber || !date || !type) {
      return NextResponse.json(
        { success: false, error: 'sjNumber, date, and type are required' },
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
          qty: Number(item.qty) || 0,
          unit: (item.unit as string) || '',
          notes: (item.notes as string) || null,
        }))
      : []

    const suratJalan = await db.suratJalan.create({
      data: {
        projectId,
        sjNumber,
        date: new Date(date),
        type,
        notes,
        checkerName,
        driverName,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: suratJalan }, { status: 201 })
  } catch (error) {
    console.error('Error creating surat jalan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create surat jalan' },
      { status: 500 }
    )
  }
}
