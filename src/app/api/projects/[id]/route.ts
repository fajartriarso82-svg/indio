import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            purchases: {
              include: {
                vendor: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        rabPurchases: {
          include: {
            vendor: { select: { id: true, name: true } },
            projectItem: { select: { id: true, itemName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        additionalCosts: {
          include: {
            vendor: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        progressNotes: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        suratJalans: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        basts: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            items: true,
            termins: { orderBy: { terminNo: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        kuitansis: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      name,
      type,
      status,
      clientId,
      clientPicName,
      clientPicEmail,
      clientPicPhone,
      clientAddress,
      poNumber,
      internalPic,
      poFileUrl,
      rabFileUrl,
      startDate,
      endDate,
      notes,
    } = body

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(clientId !== undefined && { clientId }),
        ...(clientPicName !== undefined && { clientPicName }),
        ...(clientPicEmail !== undefined && { clientPicEmail }),
        ...(clientPicPhone !== undefined && { clientPicPhone }),
        ...(clientAddress !== undefined && { clientAddress }),
        ...(poNumber !== undefined && { poNumber }),
        ...(internalPic !== undefined && { internalPic }),
        ...(poFileUrl !== undefined && { poFileUrl }),
        ...(rabFileUrl !== undefined && { rabFileUrl }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    await db.project.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
