'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CompletedTx {
  id: string
  transactionId: string
  date: string
  clientName: string | null
  paymentMethod: string
  grandTotal: number
  status: string
}

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState<'penjualan' | 'kaskecil'>('penjualan')
  const [loading, setLoading] = useState(true)
  const [balanceThisMonth, setBalanceThisMonth] = useState(0)
  const [pettyCashBalance, setPettyCashBalance] = useState(0)
  const [completedSales, setCompletedSales] = useState<CompletedTx[]>([])

  useEffect(() => {
    let cancelled = false
    const loadFinance = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/transactions'),
        ])
        const statsData = await statsRes.json().catch(() => ({}))
        const txData = await txRes.json().catch(() => ({}))

        if (!cancelled) {
          setBalanceThisMonth(statsData?.balanceThisMonth ?? 0)
          setPettyCashBalance(statsData?.pettyCashBalance ?? 0)
          if (txData?.success && Array.isArray(txData.data)) {
            setCompletedSales(txData.data.filter((t: CompletedTx) => t.status === 'SUCCESS'))
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadFinance()
    return () => {
      cancelled = true
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalSalesRevenue = completedSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0)
  const estProfit = Math.round(totalSalesRevenue * 0.18)

  return (
    <div className="space-y-6">
      {/* ===== KUSALE 4 KPI CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Total Pemasukan</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[20px] xl:text-[24px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(totalSalesRevenue || balanceThisMonth)}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              Bulan Ini ▲
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#E6F8F3] dark:bg-emerald-500/15 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Estimasi Profit</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[20px] xl:text-[24px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(estProfit)}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              ~18% ▲
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
            <Coins className="w-5 h-5 text-[#F97316] dark:text-orange-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Saldo Kas Kecil</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[20px] xl:text-[24px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(pettyCashBalance)}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400">
              Aktif
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#FFEFEF] dark:bg-rose-500/15 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-[#E11D48] dark:text-rose-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Pengeluaran Kas</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[20px] xl:text-[24px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(0)}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400">
              Bulan Ini
            </span>
          </div>
        </div>
      </div>

      {/* ===== SEGMENTED TABS ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs">
          <button
            onClick={() => setActiveTab('penjualan')}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all ${
              activeTab === 'penjualan'
                ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            Rekap Penjualan ({completedSales.length})
          </button>
          <button
            onClick={() => setActiveTab('kaskecil')}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all ${
              activeTab === 'kaskecil'
                ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            Kas Kecil
          </button>
        </div>

        {activeTab === 'kaskecil' && (
          <div className="flex items-center gap-2">
            <button className="h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold inline-flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Tambah Saldo</span>
            </button>
            <button className="h-10 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === 'penjualan' ? (
          completedSales.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="font-bold text-foreground text-sm">Belum ada data penjualan tercatat</p>
              <p className="text-xs mt-1">
                Data akan muncul setelah ada transaksi POS berstatus selesai.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-bold text-[13px] text-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Invoice / ID
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Date
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Method
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Grand Total
                    </TableHead>
                    <TableHead className="py-4 pr-6 text-right font-bold text-[13px] text-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSales.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted border border-border/60 flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-[13.5px] text-foreground">
                            {tx.clientName || 'Pelanggan Umum'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[13px] font-semibold text-primary">
                          {tx.transactionId}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-[13px] text-muted-foreground">
                        {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
                          {tx.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-[13.5px] text-foreground">
                        {formatCurrency(tx.grandTotal)}
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
                          Lunas
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
              <Coins className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Riwayat Kas Kecil</p>
            <p className="text-xs mt-1">
              Gunakan tombol Tambah Saldo atau Catat Pengeluaran di atas untuk mengelola mutasi kas kecil.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
