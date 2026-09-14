import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { products } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 })
    }

    let importedCount = 0
    let updatedCount = 0

    // Process each product sequentially to handle upserts properly
    for (const item of products) {
      if (!item.productId) continue

      const existingProduct = await prisma.product.findUnique({
        where: { productId: item.productId }
      })

      if (existingProduct) {
        // Update existing (Stok Adjustment)
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            qty: existingProduct.qty + (Number(item.qty) || 0),
            sellPrice: Number(item.sellPrice) || existingProduct.sellPrice,
            costPrice: Number(item.costPrice) || existingProduct.costPrice,
            retailPrice: Number(item.retailPrice) || existingProduct.retailPrice,
            category: item.category || existingProduct.category,
            subCategory: item.subCategory || existingProduct.subCategory,
            name: item.name || existingProduct.name,
            spec: item.spec || existingProduct.spec,
            warranty: item.warranty || existingProduct.warranty
          }
        })
        updatedCount++
      } else {
        // Create new
        await prisma.product.create({
          data: {
            productId: item.productId,
            category: item.category || 'Lainnya',
            subCategory: item.subCategory || '',
            name: item.name || 'Unknown',
            spec: item.spec || '',
            qty: Number(item.qty) || 0,
            sellPrice: Number(item.sellPrice) || 0,
            costPrice: Number(item.costPrice) || 0,
            retailPrice: Number(item.retailPrice) || 0,
            warranty: item.warranty || ''
          }
        })
        importedCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported: importedCount, updated: updatedCount }
    })
  } catch (error) {
    console.error('Error importing products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import products' },
      { status: 500 }
    )
  }
}
