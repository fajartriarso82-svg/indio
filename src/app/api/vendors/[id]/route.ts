import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        purchases: {
          select: { id: true, qty: true, buyPrice: true, totalBuy: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        additionalCosts: {
          select: { id: true, category: true, description: true, amount: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { purchases: true, additionalCosts: true },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: vendor })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { name, address, phone, email, picName, picPhone, category, bankName, bankAccount, bankHolder, notes } = body

    const existing = await db.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const vendor = await db.vendor.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: vendor })
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const existing = await db.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    await db.vendor.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Vendor deleted' })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
