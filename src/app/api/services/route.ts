import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { date: 'desc' },
      include: { actions: true }
    })
    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar service' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      clientType,
      client,
      itemName,
      brand,
      modelType,
      serialNumber,
      completeness,
      complaint,
      photoUrl
    } = body

    // Generate Service ID robustly
    const prefix = `SVC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
    
    const lastService = await prisma.service.findFirst({
      where: { serviceId: { startsWith: prefix } },
      orderBy: { serviceId: 'desc' }
    })

    let nextNum = 1
    if (lastService) {
      const parts = lastService.serviceId.split('-')
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1
      }
    }
    
    const svcId = `${prefix}-${nextNum.toString().padStart(4, '0')}`

    const service = await prisma.service.create({
      data: {
        serviceId: svcId,
        clientId: clientType === 'registered' ? client.id : null,
        clientName: client.name || 'Pelanggan Umum',
        clientPhone: client.phone || null,
        clientAddress: client.address || null,
        itemName,
        brand: brand || null,
        modelType: modelType || null,
        serialNumber: serialNumber || null,
        completeness: completeness || null,
        complaint,
        photoUrl: photoUrl || null,
        status: 'PENDING'
      }
    })

    // If client is new, we might want to save it to Client DB, but usually we just let them save via the "Simpan ke Daftar Klien" button on frontend.

    return NextResponse.json({ success: true, data: service })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal membuat service' }, { status: 500 })
  }
}
