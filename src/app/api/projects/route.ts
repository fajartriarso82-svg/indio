import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { projectCode: { contains: search } },
        { poNumber: { contains: search } },
      ]
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, picName: true, phone: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      db.project.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
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
      createdBy,
      items,
    } = body

    if (!name || !type || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and clientId are required' },
        { status: 400 }
      )
    }

    // Auto-generate projectCode: PRJ-YYYY-NNN
    const currentYear = new Date().getFullYear().toString()
    const prefix = `PRJ-${currentYear}-`

    const lastProject = await db.project.findFirst({
      where: { projectCode: { startsWith: prefix } },
      orderBy: { projectCode: 'desc' },
      select: { projectCode: true },
    })

    let nextNumber = 1
    if (lastProject) {
      const lastNumber = parseInt(lastProject.projectCode.split('-').pop() || '0', 10)
      nextNumber = lastNumber + 1
    }
    const projectCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`

    // Prepare items with calculated totals
    const itemsData = Array.isArray(items)
      ? items.map((item: Record<string, unknown>, index: number) => ({
          itemId: (item.itemId as string) || '',
          itemCode: (item.itemCode as string) || null,
          itemName: (item.itemName as string) || '',
          qty: Number(item.qty) || 0,
          unit: (item.unit as string) || '',
          unitPrice: Number(item.unitPrice) || 0,
          total: (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
          deadline: item.deadline ? new Date(item.deadline as string) : null,
          notes: (item.notes as string) || null,
          sortOrder: index,
        }))
      : []

    const project = await db.project.create({
      data: {
        projectCode,
        name,
        type,
        status: 'DRAFT',
        clientId,
        clientPicName,
        clientPicEmail,
        clientPicPhone,
        clientAddress,
        poNumber,
        internalPic,
        poFileUrl,
        rabFileUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes,
        createdBy,
        items: {
          create: itemsData,
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
