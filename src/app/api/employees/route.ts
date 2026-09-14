import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const company = await prisma.company.findFirst()
    if (!company) {
      return NextResponse.json({ success: true, data: [] })
    }
    const employees = await prisma.employee.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: employees })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar karyawan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let company = await prisma.company.findFirst()
    if (!company) {
      company = await prisma.company.create({ data: { name: 'Perusahaan Baru' } })
    }

    const employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeId: body.employeeId || `EMP-${Date.now()}`,
        name: body.name,
        phone: body.phone,
        position: body.position,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })
    return NextResponse.json({ success: true, data: employee })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal membuat karyawan' }, { status: 500 })
  }
}
