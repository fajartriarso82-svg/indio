import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
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

    const product = await prisma.product.create({
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
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    )
  }
}
