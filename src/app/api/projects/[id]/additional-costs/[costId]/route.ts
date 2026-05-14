import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; costId: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, costId } = await context.params
    const body = await request.json()
    const { category, description, amount, vendorId, docUrl, notes } = body

    const existing = await db.projectAdditionalCost.findFirst({
      where: { id: costId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Additional cost not found' },
        { status: 404 }
      )
    }

    const additionalCost = await db.projectAdditionalCost.update({
      where: { id: costId },
      data: {
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(vendorId !== undefined && { vendorId: vendorId || null }),
        ...(docUrl !== undefined && { docUrl }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: additionalCost })
  } catch (error) {
    console.error('Error updating additional cost:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update additional cost' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, costId } = await context.params

    const existing = await db.projectAdditionalCost.findFirst({
      where: { id: costId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Additional cost not found' },
        { status: 404 }
      )
    }

    await db.projectAdditionalCost.delete({ where: { id: costId } })

    return NextResponse.json({ success: true, message: 'Additional cost deleted' })
  } catch (error) {
    console.error('Error deleting additional cost:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete additional cost' },
      { status: 500 }
    )
  }
}
