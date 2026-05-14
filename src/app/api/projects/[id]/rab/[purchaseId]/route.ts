import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; purchaseId: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, purchaseId } = await context.params
    const body = await request.json()
    const { projectItemId, vendorId, qty, buyPrice, docUrl, notes } = body

    const existing = await db.rABPurchase.findFirst({
      where: { id: purchaseId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'RAB purchase not found' },
        { status: 404 }
      )
    }

    const finalQty = qty !== undefined ? Number(qty) : existing.qty
    const finalBuyPrice = buyPrice !== undefined ? Number(buyPrice) : existing.buyPrice
    const totalBuy = finalQty * finalBuyPrice

    const purchase = await db.rABPurchase.update({
      where: { id: purchaseId },
      data: {
        ...(projectItemId !== undefined && { projectItemId }),
        ...(vendorId !== undefined && { vendorId: vendorId || null }),
        ...(qty !== undefined && { qty: finalQty }),
        ...(buyPrice !== undefined && { buyPrice: finalBuyPrice }),
        totalBuy,
        ...(docUrl !== undefined && { docUrl }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        projectItem: { select: { id: true, itemName: true } },
      },
    })

    return NextResponse.json({ success: true, data: purchase })
  } catch (error) {
    console.error('Error updating RAB purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update RAB purchase' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId, purchaseId } = await context.params

    const existing = await db.rABPurchase.findFirst({
      where: { id: purchaseId, projectId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'RAB purchase not found' },
        { status: 404 }
      )
    }

    await db.rABPurchase.delete({ where: { id: purchaseId } })

    return NextResponse.json({ success: true, message: 'RAB purchase deleted' })
  } catch (error) {
    console.error('Error deleting RAB purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete RAB purchase' },
      { status: 500 }
    )
  }
}
