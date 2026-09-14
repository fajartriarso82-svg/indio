import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const company = await prisma.company.findFirst()
    return NextResponse.json({ success: true, data: company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat profil perusahaan' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const existing = await prisma.company.findFirst()

    if (existing) {
      const updated = await prisma.company.update({
        where: { id: existing.id },
        data: body
      })
      return NextResponse.json({ success: true, data: updated })
    } else {
      const created = await prisma.company.create({
        data: {
          name: body.name || 'Perusahaan Baru',
          ...body
        }
      })
      return NextResponse.json({ success: true, data: created })
    }
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal menyimpan profil perusahaan' }, { status: 500 })
  }
}
