import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Transactions
    const todayTransactions = await prisma.transaction.count({
      where: { date: { gte: today } }
    })
    
    const monthTransactions = await prisma.transaction.count({
      where: { date: { gte: startOfMonth } }
    })
    
    // Services this month
    const servicesThisMonth = await prisma.service.groupBy({
      by: ['status'],
      where: { date: { gte: startOfMonth } },
      _count: {
        id: true,
      },
    })
    
    const serviceStats = {
      process: 0,
      pending: 0,
      success: 0,
    }
    
    servicesThisMonth.forEach((s) => {
      if (s.status === 'PROSES' || s.status === 'DIKIRIM_KE_SERVICE_CENTER') serviceStats.process += s._count.id
      else if (s.status === 'PENDING') serviceStats.pending += s._count.id
      else if (s.status === 'SELESAI') serviceStats.success += s._count.id
    })

    // Balances this month
    const monthSalesTransactions = await prisma.transaction.aggregate({
      where: { date: { gte: startOfMonth }, status: 'SUCCESS' },
      _sum: { grandTotal: true }
    })
    const monthServices = await prisma.service.aggregate({
      where: { date: { gte: startOfMonth }, status: 'SELESAI' },
      _sum: { totalCost: true }
    })
    
    const balanceThisMonth = (monthSalesTransactions._sum.grandTotal || 0) + (monthServices._sum.totalCost || 0)
    
    // Petty Cash Balance
    const pettyCashIncome = await prisma.pettyCash.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true }
    })
    const pettyCashExpense = await prisma.pettyCash.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true }
    })
    const pettyCashBalance = (pettyCashIncome._sum.amount || 0) - (pettyCashExpense._sum.amount || 0)

    return NextResponse.json({
      transactions: {
        today: todayTransactions,
        thisMonth: monthTransactions
      },
      services: serviceStats,
      balanceThisMonth,
      pettyCashBalance
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
