'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  FileDown,
  Eye,
  Loader2,
  Trash2,
  ShoppingBag,
  Wallet,
  Clock,
  ChevronDown,
  Receipt,
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
import * as XLSX from 'xlsx'

import TransactionFormModal from './TransactionFormModal'
import TransactionDetailModal from './TransactionDetailModal'

interface TransactionItem {
  id: string
  name: string
  qty: number
  unitPrice: number
  totalPrice: number
}

interface Transaction {
  id: string
  transactionId: string
  date: string
  clientName: string | null
  clientPhone?: string | null
  clientAddress?: string | null
  subTotal: number
  discount: number
  tax: number
  shippingCost: number
  grandTotal: number
  paymentMethod: string
  status: string
  items?: TransactionItem[]
}

type TxStatusTab = 'ALL' | 'SUCCESS' | 'PENDING' | 'CANCELLED'

export default function TransactionModule() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<TxStatusTab>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      if (data.success) {
        setTransactions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statusBadgeClass = (status: string) =>
    status === 'SUCCESS'
      ? 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400'
      : status === 'PENDING'
      ? 'bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400'
      : 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400'

  const handleDelete = async (txId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return
    try {
      const res = await fetch(`/api/transactions/${txId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchTransactions()
      } else {
        alert(data.error || 'Gagal menghapus transaksi')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    }
  }

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk di-export.')
      return
    }

    const exportData = transactions.map((t) => ({
      'ID Transaksi': t.transactionId,
      'Tanggal': format(new Date(t.date), 'dd MMM yyyy, HH:mm', { locale: id }),
      'Pelanggan': t.clientName || 'Pelanggan Umum',
      'Metode Bayar': t.paymentMethod,
      'Subtotal (Rp)': t.subTotal,
      'Diskon (Rp)': t.discount,
      'PPN (Rp)': t.tax,
      'Ongkir (Rp)': t.shippingCost,
      'Grand Total (Rp)': t.grandTotal,
      'Status': t.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Transaksi_Z-Indio_${dateStr}.xlsx`)
  }

  // KPI Summary
  const kpi = useMemo(() => {
    const totalOrders = transactions.length
    const successTx = transactions.filter((t) => t.status === 'SUCCESS')
    const totalRevenue = successTx.reduce((acc, t) => acc + (t.grandTotal || 0), 0)
    const pendingCount = transactions.filter((t) => t.status === 'PENDING').length
    return {
      totalOrders,
      successCount: successTx.length,
      totalRevenue,
      pendingCount,
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (statusTab !== 'ALL' && t.status !== statusTab) return false
        const q = search.toLowerCase()
        return (
          !q ||
          t.transactionId.toLowerCase().includes(q) ||
          (t.clientName && t.clientName.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
  }, [transactions, statusTab, search, sortOrder])

  return (
    <div className="space-y-6">
      {/* ===== KUSALE 3 KPI SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Total Orders</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.totalOrders}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              {kpi.successCount} Selesai ▲
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#E6F8F3] dark:bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Total Revenue</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[22px] sm:text-[26px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(kpi.totalRevenue)}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400 shrink-0">
              Lunas ▲
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusTab('PENDING')}
          className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-primary/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#F97316] dark:text-orange-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Pending Orders</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.pendingCount} Orders
            </p>
          </div>
        </div>
      </div>

      {/* ===== KUSALE TOOLBAR ===== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Segmented Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto max-w-full">
          {(
            [
              { key: 'ALL', label: 'All Orders' },
              { key: 'SUCCESS', label: 'Completed' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ] as { key: TxStatusTab; label: string }[]
          ).map((tab) => {
            const active = statusTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search orders or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* ===== KUSALE DATA TABLE ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Klik &apos;Transaksi Baru&apos; untuk mulai mencatat penjualan.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-primary">{tx.transactionId}</p>
                      <p className="font-bold text-sm text-foreground mt-0.5">
                        {tx.clientName || 'Pelanggan Umum'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${statusBadgeClass(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">{tx.paymentMethod}</p>
                      <p className="font-bold text-sm text-foreground">
                        {formatCurrency(tx.grandTotal)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedTransaction(tx)
                          setDetailModalOpen(true)
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-bold text-[13px] text-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Order ID
                    </TableHead>
                    <TableHead
                      className="py-4 font-bold text-[13px] text-foreground cursor-pointer"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Date
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Payment
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Total
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="py-4 pr-6 text-right font-bold text-[13px] text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-[13.5px] text-foreground">
                              {tx.clientName || 'Pelanggan Umum'}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground">
                              {tx.items?.length ? `${tx.items.length} Item` : 'Transaksi POS'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[13px] font-semibold text-primary">
                          {tx.transactionId}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-[13px] text-muted-foreground font-medium">
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
                      <TableCell className="py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${statusBadgeClass(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTransaction(tx)
                              setDetailModalOpen(true)
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <TransactionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchTransactions}
      />

      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transaction={selectedTransaction}
      />
    </div>
  )
}
