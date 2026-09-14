'use client'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  paymentProofUrl?: string | null
  status: string
  items?: TransactionItem[]
}

interface TransactionDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export default function TransactionDetailModal({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailModalProps) {
  if (!transaction) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">Detail Transaksi</DialogTitle>
              <DialogDescription className="mt-1">
                {transaction.transactionId}
              </DialogDescription>
            </div>
            <Badge
              className={
                transaction.status === 'SUCCESS'
                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                  : transaction.status === 'PENDING'
                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
              }
            >
              {transaction.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Info Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informasi Pelanggan
              </h4>
              <p className="font-medium text-lg">{transaction.clientName || 'Pelanggan Umum'}</p>
              {transaction.clientPhone && <p className="text-sm text-muted-foreground">{transaction.clientPhone}</p>}
              {transaction.clientAddress && <p className="text-sm text-muted-foreground">{transaction.clientAddress}</p>}
            </div>
            <div className="space-y-1 md:text-right">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Detail Pembayaran
              </h4>
              <p className="text-sm">
                <span className="text-muted-foreground">Tanggal:</span>{' '}
                <span className="font-medium">
                  {format(new Date(transaction.date), 'dd MMMM yyyy, HH:mm', { locale: id })}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Metode:</span>{' '}
                <span className="font-medium">{transaction.paymentMethod}</span>
              </p>
            </div>
          </div>

          {/* Tabel Barang */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Daftar Barang
            </h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Tidak ada detail barang tersimpan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Ringkasan Biaya */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(transaction.subTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span className="font-medium text-rose-600">
                  -{formatCurrency(transaction.discount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">{formatCurrency(transaction.shippingCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">PPN</span>
                <span className="font-medium">{formatCurrency(transaction.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Grand Total</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(transaction.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-between bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <div className="flex gap-2">
            {transaction.paymentMethod !== 'CASH' && transaction.paymentProofUrl && (
              <Button 
                variant="outline" 
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => window.open(transaction.paymentProofUrl || undefined, '_blank')}
              >
                Lihat Bukti Bayar
              </Button>
            )}
            <Button 
              variant="secondary" 
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
              onClick={() => window.open(`/print/transaction/${transaction.id}`, '_blank')}
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak Ulang Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
