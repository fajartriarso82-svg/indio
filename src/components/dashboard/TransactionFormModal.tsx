'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Plus, Trash2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface TransactionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ClientInfo {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

interface TransactionItem {
  id: string
  productId: string
  name: string
  modelType: string
  spec: string
  qty: number
  unitPrice: number
  totalPrice: number
}

export default function TransactionFormModal({
  open,
  onOpenChange,
  onSuccess,
}: TransactionFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [clientType, setClientType] = useState<'registered' | 'new'>('registered')
  const [client, setClient] = useState<Partial<ClientInfo>>({})
  
  const [items, setItems] = useState<TransactionItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  useEffect(() => {
    // Fetch products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data)
        }
      })
      .catch(err => console.error('Failed to fetch products:', err))

    // Fetch clients
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClients(data.data)
        }
      })
      .catch(err => console.error('Failed to fetch clients:', err))
  }, [])
  
  const [discount, setDiscount] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [taxRate, setTaxRate] = useState(11) // 11% PPN
  
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [proofFile, setProofFile] = useState<File | null>(null)

  const resetForm = () => {
    setClientType('registered')
    setClient({ id: '', name: '', phone: '', email: '', address: '' })
    setItems([
      { id: '1', productId: '', name: '', modelType: '', spec: '', qty: 1, unitPrice: 0, totalPrice: 0 }
    ])
    setDiscount(0)
    setShippingCost(0)
    setTaxRate(11)
    setPaymentMethod('CASH')
    setProofFile(null)
  }

  const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = (subTotal - discount) * (taxRate / 100)
  const grandTotal = subTotal - discount + taxAmount + shippingCost

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumberInput = (num: number) => {
    if (num === 0) return ''
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const parseNumberInput = (str: string) => {
    return parseInt(str.replace(/\D/g, ''), 10) || 0
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substring(7),
        productId: '',
        name: '',
        modelType: '',
        spec: '',
        qty: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ])
  }

  const handleUpdateItem = (id: string, updates: Partial<TransactionItem>) => {
    setItems(prevItems => 
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates }
          // Recalculate total if qty or unitPrice changed
          if (updates.qty !== undefined || updates.unitPrice !== undefined) {
            updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      })
    )
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSaveClient = async () => {
    if (!client.name) {
      alert("Nama pelanggan harus diisi")
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: client.name,
          phone: client.phone || '',
          email: client.email || '',
          address: client.address || ''
        })
      })
      const data = await res.json()
      if (data.success) {
        alert("Pelanggan berhasil disimpan ke daftar klien.")
        setClients([data.data, ...clients])
      } else {
        alert("Gagal menyimpan pelanggan.")
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let paymentProofUrl = null

      // Upload file if selected
      if (proofFile && paymentMethod !== 'CASH') {
        const formData = new FormData()
        formData.append('file', proofFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          paymentProofUrl = uploadData.url
        } else {
          alert('Gagal mengupload bukti pembayaran')
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
        resetForm()
        onOpenChange(false)
      } else {
        alert("Gagal menyimpan transaksi: " + data.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Transaksi Baru</DialogTitle>
          <DialogDescription>
            Buat transaksi penjualan baru. Isi data pelanggan dan daftar barang.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Pelanggan Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Pelanggan</h3>
              <div className="flex gap-4 mb-4 items-center">
                <Button
                  type="button"
                  variant={clientType === 'registered' ? 'default' : 'outline'}
                  onClick={() => setClientType('registered')}
                  size="sm"
                >
                  Pelanggan Terdaftar
                </Button>
                <Button
                  type="button"
                  variant={clientType === 'new' ? 'default' : 'outline'}
                  onClick={() => setClientType('new')}
                  size="sm"
                >
                  Pelanggan Baru / Umum
                </Button>
                {clientType === 'new' && (
                  <Button type="button" variant="outline" size="sm" onClick={handleSaveClient} disabled={loading} className="ml-auto">
                    Simpan ke Daftar Klien
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientType === 'registered' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Pilih Pelanggan</Label>
                    <Select onValueChange={(val) => {
                      const selected = clients.find(c => c.id === val)
                      if (selected) {
                        setClient({
                          id: selected.id,
                          name: selected.name,
                          phone: selected.phone || '',
                          email: selected.email || '',
                          address: selected.address || ''
                        })
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cari ID atau Nama Pelanggan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input
                        value={client.name || ''}
                        onChange={(e) => setClient({ ...client, name: e.target.value })}
                        placeholder="Nama pelanggan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP / WhatsApp</Label>
                      <Input
                        value={client.phone || ''}
                        onChange={(e) => setClient({ ...client, phone: e.target.value })}
                        placeholder="08..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={client.email || ''}
                        onChange={(e) => setClient({ ...client, email: e.target.value })}
                        placeholder="email@contoh.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Lengkap</Label>
                      <Input
                        value={client.address || ''}
                        onChange={(e) => setClient({ ...client, address: e.target.value })}
                        placeholder="Alamat pelanggan"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Barang Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Daftar Barang</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" size="sm" onClick={resetForm}>
                    Kosongkan Form
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="w-4 h-4" />
                    Tambah Baris
                  </Button>
                </div>
              </div>

              {/* ===== MOBILE: Kartu item (md ke bawah) ===== */}
              <div className="md:hidden space-y-3">
                {items.length === 0 ? (
                  <div className="border rounded-md text-center text-muted-foreground py-8 text-sm">
                    Belum ada barang yang ditambahkan
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Barang #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Select
                        value={item.productId}
                        onValueChange={(val) => {
                          const prod = products.find((p) => p.id === val)
                          if (prod) {
                            handleUpdateItem(item.id, {
                              productId: prod.id,
                              name: prod.name,
                              unitPrice: prod.sellPrice,
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Pilih barang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} - {formatCurrency(p.sellPrice)} (Stok: {p.qty})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">QTY</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberInput(item.qty)}
                            onChange={(e) => handleUpdateItem(item.id, { qty: parseNumberInput(e.target.value) })}
                            className="h-10 text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Harga Satuan</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberInput(item.unitPrice)}
                            onChange={(e) => handleUpdateItem(item.id, { unitPrice: parseNumberInput(e.target.value) })}
                            className="h-10 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2.5">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ===== DESKTOP: Tabel ===== */}
              <div className="hidden md:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[200px]">Nama Barang</TableHead>
                        <TableHead className="w-[100px]">QTY</TableHead>
                        <TableHead className="min-w-[150px]">Harga Satuan</TableHead>
                        <TableHead className="min-w-[150px]">Total</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Belum ada barang yang ditambahkan
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="p-2 min-w-[200px]">
                              <Select
                                value={item.productId}
                                onValueChange={(val) => {
                                  const prod = products.find(p => p.id === val)
                                  if (prod) {
                                    handleUpdateItem(item.id, {
                                      productId: prod.id,
                                      name: prod.name,
                                      unitPrice: prod.sellPrice
                                    })
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Pilih barang..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name} - {formatCurrency(p.sellPrice)} (Stok: {p.qty})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-2 min-w-[80px]">
                              <Input
                                type="text"
                                value={formatNumberInput(item.qty)}
                                onChange={(e) => handleUpdateItem(item.id, { qty: parseNumberInput(e.target.value) })}
                                className="h-8 text-center"
                              />
                            </TableCell>
                            <TableCell className="p-2 min-w-[150px]">
                              <Input
                                type="text"
                                value={formatNumberInput(item.unitPrice)}
                                onChange={(e) => handleUpdateItem(item.id, { unitPrice: parseNumberInput(e.target.value) })}
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell className="p-2 font-medium">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                            <TableCell className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Ringkasan & Pembayaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Pembayaran</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                        <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMethod !== 'CASH' && (
                    <div className="space-y-2">
                      <Label>Bukti Pembayaran</Label>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Ringkasan Biaya</h3>
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">Diskon (Rp)</span>
                    <Input
                      type="text"
                      value={formatNumberInput(discount)}
                      onChange={(e) => setDiscount(parseNumberInput(e.target.value))}
                      className="h-8 w-32 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">Ongkos Kirim</span>
                    <Input
                      type="text"
                      value={formatNumberInput(shippingCost)}
                      onChange={(e) => setShippingCost(parseNumberInput(e.target.value))}
                      className="h-8 w-32 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">PPN (%)</span>
                    <Input
                      type="text"
                      value={formatNumberInput(taxRate)}
                      onChange={(e) => setTaxRate(parseNumberInput(e.target.value))}
                      className="h-8 w-20 text-right"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg">Grand Total</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200">
              <Printer className="w-4 h-4" />
              Cetak Invoice
            </Button>
            <Button type="submit" form="transaction-form" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Transaksi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
