"use client"
import { useState, useEffect } from "react"
import { Plus, Search, FileDown, Eye, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as XLSX from "xlsx"

import TransactionFormModal from "./TransactionFormModal"
import TransactionDetailModal from "./TransactionDetailModal"

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

export default function TransactionModule() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc")
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

  const statusClass = (status: string) =>
    status === 'SUCCESS'
      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
      : status === 'PENDING'
        ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
        : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
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
      'Status': t.status
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Transaksi_Z-Indio_${dateStr}.xlsx`)
  }

  const filteredTransactions = transactions
    .filter(
      (t) =>
        t.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        (t.clientName && t.clientName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">POS Transaksi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola penjualan toko, pesanan, dan faktur.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExportExcel}>
            <FileDown className="w-4 h-4" />
            Export Excel
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Transaksi Baru
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ID atau Nama Klien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4">
              <p className="font-medium text-foreground">Tidak ada transaksi ditemukan</p>
              <p className="text-sm">Buat transaksi baru untuk memulai.</p>
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list (md ke bawah) ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{tx.transactionId}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      <Badge className={`shrink-0 ${statusClass(tx.status)}`}>{tx.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Pelanggan</p>
                        <p className="text-sm truncate">{tx.clientName || 'Pelanggan Umum'}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{tx.paymentMethod}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold text-sm">{formatCurrency(tx.grandTotal)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            setSelectedTransaction(tx)
                            setDetailModalOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== DESKTOP: Tabel (md ke atas) ===== */}
              <div className="hidden md:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[120px]">ID Transaksi</TableHead>
                        <TableHead
                          className="min-w-[150px] cursor-pointer"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          Tanggal {sortOrder === 'asc' ? '↑' : '↓'}
                        </TableHead>
                        <TableHead className="min-w-[120px]">Pelanggan</TableHead>
                        <TableHead className="min-w-[120px]">Metode Bayar</TableHead>
                        <TableHead className="text-right min-w-[80px]">Total</TableHead>
                        <TableHead className="text-center min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[80px] text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">{tx.transactionId}</TableCell>
                          <TableCell>
                            {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </TableCell>
                          <TableCell>{tx.clientName || 'Pelanggan Umum'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(tx.grandTotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusClass(tx.status)}>{tx.status}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500"
                                onClick={() => {
                                  setSelectedTransaction(tx)
                                  setDetailModalOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:bg-rose-100"
                                onClick={() => handleDelete(tx.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
