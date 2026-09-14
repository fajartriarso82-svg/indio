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
    const { sjNumber, date, type, notes, vehicle, plateNumber, driverName, items } = body

    if (!date || !type) {
      return NextResponse.json(
        { success: false, error: 'date and type are required' },
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

    let finalSjNumber = sjNumber
    if (!finalSjNumber) {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const romawiMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
      
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
      
      const countThisMonth = await db.suratJalan.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
      
      const noUrut = (countThisMonth + 1).toString().padStart(3, '0')
      finalSjNumber = `${noUrut}/SJ/INDO/${romawiMonths[month]}/${year}`
    }

    const itemsData = Array.isArray(items)
      ? items.map((item: Record<string, unknown>) => ({
          itemId: (item.itemId as string) || null,
          itemCode: (item.itemCode as string) || null,
          description: (item.description as string) || '',
          qty: Number(item.qty) || 0,
          unit: (item.unit as string) || '',
          notes: (item.notes as string) || null,
        }))
      : []

    const suratJalan = await db.suratJalan.create({
      data: {
        projectId,
        sjNumber: finalSjNumber,
        date: new Date(date),
        type,
        notes,
        vehicle,
        plateNumber,
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
