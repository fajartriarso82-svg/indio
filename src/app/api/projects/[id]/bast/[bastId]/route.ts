import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; bastId: string }>
}

// GET: Get a single BAST with items
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, bastId } = await context.params

    const bast = await db.bAST.findFirst({
      where: { id: bastId, projectId },
      include: { items: true },
    })

    if (!bast) {
      return NextResponse.json(
        { success: false, error: 'BAST not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: bast })
  } catch (error) {
    console.error('Error fetching BAST:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch BAST' },
      { status: 500 }
    )
  }
}

// PUT: Update a BAST
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, bastId } = await context.params
    const body = await request.json()
    const { bastNumber, date, type, notes, items } = body

    const existing = await db.bAST.findFirst({
      where: { id: bastId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'BAST not found' },
        { status: 404 }
      )
    }

    // If items are provided, delete old and create new
    if (Array.isArray(items)) {
      await db.bASTItem.deleteMany({ where: { bastId } })
    }

    const bast = await db.bAST.update({
      where: { id: bastId },
      data: {
        ...(bastNumber !== undefined && { bastNumber }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(type !== undefined && { type }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json({ success: true, data: bast })
  } catch (error) {
    console.error('Error updating BAST:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update BAST' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a BAST
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, bastId } = await context.params

    const existing = await db.bAST.findFirst({
      where: { id: bastId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'BAST not found' },
        { status: 404 }
      )
    }

    await db.bAST.delete({ where: { id: bastId } })

    return NextResponse.json({ success: true, message: 'BAST deleted' })
  } catch (error) {
    console.error('Error deleting BAST:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete BAST' },
      { status: 500 }
    )
  }
}
