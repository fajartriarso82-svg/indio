import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email, picName, picPhone, picEmail, type, notes } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const client = await db.client.create({
      data: {
        name,
        address,
        phone,
        email,
        picName,
        picPhone,
        picEmail,
        type: type || 'corporate',
        notes,
      },
    })

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
