import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const employee = await prisma.employee.update({
      where: { id },
      data: body
    })
    return NextResponse.json({ success: true, data: employee })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal update karyawan' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ success: false, error: error.message || 'Gagal menghapus karyawan' }, { status: 500 })
  }
}
