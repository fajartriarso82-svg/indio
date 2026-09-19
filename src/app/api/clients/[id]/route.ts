import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const client = await db.client.findUnique({
      where: { id },
      include: {
        projects: {
          select: { id: true, projectCode: true, name: true, status: true },
        },
        _count: {
          select: { projects: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { name, address, phone, email, picName, picPhone, picEmail, type, notes, isStarred, iconUrl } = body

    const existing = await db.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(picName !== undefined ? { picName } : {}),
        ...(picPhone !== undefined ? { picPhone } : {}),
        ...(picEmail !== undefined ? { picEmail } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(isStarred !== undefined ? { isStarred: Boolean(isStarred) } : {}),
        ...(iconUrl !== undefined ? { iconUrl: iconUrl ? String(iconUrl).trim() : null } : {}),
      },
    })

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const existing = await db.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    await db.client.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Client deleted' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
