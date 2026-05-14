import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendors = await db.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { purchases: true, additionalCosts: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: vendors })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email, picName, picPhone, category, bankName, bankAccount, bankHolder, notes } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const vendor = await db.vendor.create({
      data: {
        name,
        address,
        phone,
        email,
        picName,
        picPhone,
        category,
        bankName,
        bankAccount,
        bankHolder,
        notes,
      },
    })

    return NextResponse.json({ success: true, data: vendor }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
