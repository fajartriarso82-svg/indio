import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST: Add items to a project (handles array of items)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const items = Array.isArray(body) ? body : body.items ? body.items : [body]

    const existingItems = await db.projectItem.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
      take: 1,
    })
    let sortOrder = existingItems.length > 0 ? existingItems[0].sortOrder + 1 : 0

    const createdItems = await db.$transaction(
      items.map((item: Record<string, unknown>) => {
        const qty = Number(item.qty) || 0
        const unitPrice = Number(item.unitPrice) || 0
        return db.projectItem.create({
          data: {
            projectId,
            itemId: (item.itemId as string) || '',
            itemName: (item.itemName as string) || '',
            qty,
            unit: (item.unit as string) || '',
            unitPrice,
            total: qty * unitPrice,
            notes: (item.notes as string) || null,
            sortOrder: sortOrder++,
          },
        })
      })
    )

    return NextResponse.json({ success: true, data: createdItems }, { status: 201 })
  } catch (error) {
    console.error('Error adding project items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add project items' },
      { status: 500 }
    )
  }
}

// PUT: Update items (handles array with id field for each item)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const items = Array.isArray(body) ? body : body.items ? body.items : [body]

    const updatedItems = await db.$transaction(
      items.map((item: Record<string, unknown>) => {
        if (!item.id) {
          throw new Error('Each item must have an id for update')
        }
        const qty = item.qty !== undefined ? Number(item.qty) : undefined
        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : undefined
        const total =
          qty !== undefined && unitPrice !== undefined
            ? qty * unitPrice
            : undefined

        return db.projectItem.update({
          where: { id: item.id as string },
          data: {
            ...(item.itemId !== undefined && { itemId: item.itemId as string }),
            ...(item.itemName !== undefined && { itemName: item.itemName as string }),
            ...(qty !== undefined && { qty }),
            ...(item.unit !== undefined && { unit: item.unit as string }),
            ...(unitPrice !== undefined && { unitPrice }),
            ...(total !== undefined && { total }),
            ...(item.notes !== undefined && { notes: (item.notes as string) || null }),
            ...(item.sortOrder !== undefined && { sortOrder: Number(item.sortOrder) }),
          },
        })
      })
    )

    return NextResponse.json({ success: true, data: updatedItems })
  } catch (error) {
    console.error('Error updating project items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project items' },
      { status: 500 }
    )
  }
}
