import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all additional costs for a project
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

    const additionalCosts = await db.projectAdditionalCost.findMany({
      where: { projectId },
      include: {
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalAmount = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0)

    return NextResponse.json({
      success: true,
      data: additionalCosts,
      summary: { totalAmount },
    })
  } catch (error) {
    console.error('Error fetching additional costs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch additional costs' },
      { status: 500 }
    )
  }
}

// POST: Create an additional cost
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { category, description, amount, vendorId, docUrl, notes } = body

    if (!category || !description || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'category, description, and amount are required' },
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

    const additionalCost = await db.projectAdditionalCost.create({
      data: {
        projectId,
        category,
        description,
        amount: Number(amount),
        vendorId: vendorId || null,
        docUrl,
        notes,
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: additionalCost }, { status: 201 })
  } catch (error) {
    console.error('Error creating additional cost:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create additional cost' },
      { status: 500 }
    )
  }
}
