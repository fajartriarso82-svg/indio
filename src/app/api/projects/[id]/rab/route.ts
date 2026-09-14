import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: RAB data (items with purchases)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectCode: true, name: true, rabFileUrl: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const items = await db.projectItem.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        purchases: {
          include: {
            vendor: { select: { id: true, name: true, picName: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Calculate totals
    const totalRAB = items.reduce((sum, item) => sum + item.total, 0)
    const totalPurchases = items.reduce(
      (sum, item) => sum + item.purchases.reduce((s, p) => s + p.totalBuy, 0),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        project,
        items,
        summary: {
          totalRAB,
          totalPurchases,
          margin: totalRAB - totalPurchases,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching RAB data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RAB data' },
      { status: 500 }
    )
  }
}

// POST: Add a RAB purchase
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { projectItemId, vendorId, vendorName, qty, buyPrice, docUrl, notes } = body

    if (!projectItemId || qty === undefined || buyPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'projectItemId, qty, and buyPrice are required' },
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

    const projectItem = await db.projectItem.findFirst({
      where: { id: projectItemId, projectId },
    })
    if (!projectItem) {
      return NextResponse.json(
        { success: false, error: 'Project item not found in this project' },
        { status: 404 }
      )
    }

    let finalVendorId = vendorId
    if (!finalVendorId && vendorName) {
      const newVendor = await db.vendor.create({
        data: { name: vendorName }
      })
      finalVendorId = newVendor.id
    }

    const totalBuy = Number(qty) * Number(buyPrice)

    const purchase = await db.rABPurchase.create({
      data: {
        projectId,
        projectItemId,
        vendorId: finalVendorId || null,
        qty: Number(qty),
        buyPrice: Number(buyPrice),
        totalBuy,
        docUrl,
        notes,
        status: 'REQUEST',
        requestDate: new Date(),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        projectItem: { select: { id: true, itemName: true } },
      },
    })

    return NextResponse.json({ success: true, data: purchase }, { status: 201 })
  } catch (error) {
    console.error('Error creating RAB purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create RAB purchase' },
      { status: 500 }
    )
  }
}
