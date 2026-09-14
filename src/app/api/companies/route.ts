import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/companies — list all companies
export async function GET() {
  try {
    const companies = await db.company.findMany({
      include: { employees: { where: { isActive: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ success: true, data: companies })
  } catch (error) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// POST /api/companies — create company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email, picName, picPhone, npwpNumber } = body
    if (!name) return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 })
    const company = await db.company.create({
      data: { name, address, phone, email, picName, picPhone, npwpNumber },
    })
    return NextResponse.json({ success: true, data: company }, { status: 201 })
  } catch (error) {
    console.error('POST /api/companies error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create company' }, { status: 500 })
  }
}
