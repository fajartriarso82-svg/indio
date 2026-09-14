import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      productId,
      category,
      subCategory,
      name,
      spec,
      qty,
      sellPrice,
      costPrice,
      retailPrice,
      warranty
    } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        productId,
        category,
        subCategory,
        name,
        spec,
        qty: Number(qty) || 0,
        sellPrice: Number(sellPrice) || 0,
        costPrice: Number(costPrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        warranty
      }
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.product.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
