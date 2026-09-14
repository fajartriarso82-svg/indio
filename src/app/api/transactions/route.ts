import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        items: true
      },
      take: 50 // Limit for now
    })

    return NextResponse.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      clientType,
      client,
      items,
      discount,
      shippingCost,
      taxRate,
      paymentMethod,
      paymentProofUrl,
      subTotal,
      taxAmount,
      grandTotal
    } = body

    // Generate transaction ID robustly
    const prefix = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
    
    const lastTx = await prisma.transaction.findFirst({
      where: { transactionId: { startsWith: prefix } },
      orderBy: { transactionId: 'desc' }
    })

    let nextNum = 1
    if (lastTx) {
      const parts = lastTx.transactionId.split('-')
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1
      }
    }
    
    const txId = `${prefix}-${nextNum.toString().padStart(4, '0')}`

    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const newTx = await tx.transaction.create({
        data: {
          transactionId: txId,
          clientName: client.name || 'Pelanggan Umum',
          subTotal,
          discount,
          shippingCost,
          tax: taxAmount,
          grandTotal,
          paymentMethod,
          paymentProofUrl,
          status: 'SUCCESS',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              name: item.name,
              modelType: item.modelType || null,
              spec: item.spec || null,
              serialNumber: item.serialNumber || null,
              qty: item.qty,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        }
      })

      // Update inventory for products
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              qty: {
                decrement: item.qty
              }
            }
          })
        }
      }

      return newTx
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

