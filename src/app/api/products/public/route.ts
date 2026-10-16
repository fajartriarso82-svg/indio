import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        productId: true,
        name: true,
        category: true,
        subCategory: true,
        spec: true,
        sellPrice: true,
        retailPrice: true,
        qty: true,
        warranty: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching public products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch etalase products' },
      { status: 500 }
    )
  }
}
