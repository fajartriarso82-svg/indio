import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      status,
      technician,
      actionNote,
      sparepartDetails,
      sparepartCost,
      serviceFee,
      shippingCost,
      totalCost
    } = body

    const updateData: any = {
      status
    }

    if (sparepartDetails !== undefined) updateData.sparepartDetails = sparepartDetails
    if (sparepartCost !== undefined) updateData.sparepartCost = sparepartCost
    if (serviceFee !== undefined) updateData.serviceFee = serviceFee
    if (shippingCost !== undefined) updateData.shippingCost = shippingCost
    if (totalCost !== undefined) updateData.totalCost = totalCost

    // Run in transaction to update service and conditionally add action
    const service = await prisma.$transaction(async (tx) => {
      const updatedSvc = await tx.service.update({
        where: { id },
        data: updateData
      })

      if (actionNote) {
        await tx.serviceAction.create({
          data: {
            serviceId: id,
            technician: technician || null,
            action: actionNote
          }
        })
      }

      return updatedSvc
    })

    return NextResponse.json({ success: true, data: service })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal update service' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal menghapus service' }, { status: 500 })
  }
}
