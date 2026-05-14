import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all BAST for a project
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

    const basts = await db.bAST.findMany({
      where: { projectId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: basts })
  } catch (error) {
    console.error('Error fetching BASTs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch BASTs' },
      { status: 500 }
    )
  }
}

// POST: Create a BAST
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { bastNumber, date, type, notes, items } = body

    if (!bastNumber || !date || !type) {
      return NextResponse.json(
        { success: false, error: 'bastNumber, date, and type are required' },
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

    const bast = await db.bAST.create({
      data: {
        projectId,
        bastNumber,
        date: new Date(date),
        type,
        notes,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: bast }, { status: 201 })
  } catch (error) {
    console.error('Error creating BAST:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create BAST' },
      { status: 500 }
    )
  }
}
