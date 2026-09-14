import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // Run in transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Get items first to restore stock
      const items = await tx.transactionItem.findMany({
        where: { transactionId: id }
      })

      // Delete items
      await tx.transactionItem.deleteMany({
        where: { transactionId: id }
      })

      // Delete transaction
      await tx.transaction.delete({
        where: { id }
      })

      // Restore inventory
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { qty: { increment: item.qty } }
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus transaksi' },
      { status: 500 }
    )
  }
}
