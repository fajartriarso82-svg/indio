'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Loader2,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface RABRealisasiItem {
  id: string
  projectId: string
  rabItemId: string | null
  rabItem?: {
    id: string
    namaItem: string
    satuan: string
    topik: { id: string; nama: string }
  } | null
  vendorId: string | null
  vendor?: { id: string; name: string; isPKP: boolean } | null
  vendorNama: string | null
  nomorInvoice: string | null
  tanggalInvoice: string
  jumlah: number
  keterangan: string | null
  kenaPPN: boolean
  persenPPN: number
  statusBayar: string
  tanggalBayar: string | null
  fileBuktiUrl: string | null
  buktiBayarUrl: string | null
  isAdditional: boolean
  kategoriAdditional: string | null
}

interface RABTopikOption {
  id: string
  nama: string
  items: { id: string; namaItem: string; satuan: string }[]
}

interface VendorOption {
  id: string
  name: string
  isPKP: boolean
}

interface RABRealisasiModuleProps {
  projectId: string
  projectStatus: string
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  belum_dibayar: { label: 'Belum Dibayar', className: 'bg-rose-100 text-rose-700 border-rose-300' },
  sudah_dibayar: { label: 'Sudah Dibayar', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
}

export default function RABRealisasiModule({ projectId, projectStatus }: RABRealisasiModuleProps) {
  const { toast } = useToast()
  const [realisasi, setRealisasi] = useState<RABRealisasiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [topikOptions, setTopikOptions] = useState<RABTopikOption[]>([])
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([])

  // Add realisasi dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addIsAdditional, setAddIsAdditional] = useState(false)
  const [form, setForm] = useState({
    rabItemId: '',
    vendorId: '',
    vendorNama: '',
    nomorInvoice: '',
    tanggalInvoice: new Date().toISOString().split('T')[0],
    jumlah: '',
    keterangan: '',
    kenaPPN: false,
    persenPPN: '11',
    kategoriAdditional: 'LAINNYA',
  })
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Pay dialog
  const [payOpen, setPayOpen] = useState(false)
  const [payItem, setPayItem] = useState<RABRealisasiItem | null>(null)
  const [payProofFile, setPayProofFile] = useState<File | null>(null)
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split('T')[0])
  const [submittingPay, setSubmittingPay] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filter
  const [filterStatus, setFilterStatus] = useState<'all' | 'belum_dibayar' | 'sudah_dibayar'>('all')
  const [showAdditional, setShowAdditional] = useState(true)

  const fetchRealisasi = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/rab-realisasi`)
      const data = await res.json()
      if (data.success) setRealisasi(data.data)
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat realisasi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchRealisasi() }, [fetchRealisasi])

  useEffect(() => {
    if (addOpen) {
      // Fetch RAB topiks
      fetch(`/api/projects/${projectId}/rab-topik`)
        .then(r => r.json())
        .then(d => { if (d.success) setTopikOptions(d.data.topiks) })
        .catch(() => {})

      // Fetch vendors
      fetch('/api/vendors')
        .then(r => r.json())
        .then(d => { if (d.success) setVendorOptions(d.data) })
        .catch(() => {})
    }
  }, [addOpen, projectId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.jumlah || parseFloat(form.jumlah) <= 0) {
      toast({ title: 'Error', description: 'Nominal harus lebih dari 0', variant: 'destructive' })
      return
    }
    if (!addIsAdditional && !form.rabItemId) {
      toast({ title: 'Error', description: 'Pilih item RAB terlebih dahulu', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      let fileBuktiUrl = ''
      if (invoiceFile) {
        const fd = new FormData()
        fd.append('file', invoiceFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (uploadData.success) fileBuktiUrl = uploadData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab-realisasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rabItemId: addIsAdditional ? null : (form.rabItemId || null),
          vendorId: form.vendorId || null,
          vendorNama: form.vendorNama || null,
          nomorInvoice: form.nomorInvoice || null,
          tanggalInvoice: form.tanggalInvoice,
          jumlah: parseFloat(form.jumlah.replace(/\./g, '').replace(',', '.')) || 0,
          keterangan: form.keterangan || null,
          kenaPPN: form.kenaPPN,
          persenPPN: form.kenaPPN ? parseFloat(form.persenPPN) : 0,
          fileBuktiUrl: fileBuktiUrl || null,
          isAdditional: addIsAdditional,
          kategoriAdditional: addIsAdditional ? form.kategoriAdditional : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Realisasi ditambahkan', description: 'Invoice vendor berhasil dicatat' })
        setAddOpen(false)
        resetForm()
        fetchRealisasi()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      rabItemId: '', vendorId: '', vendorNama: '', nomorInvoice: '',
      tanggalInvoice: new Date().toISOString().split('T')[0],
      jumlah: '', keterangan: '', kenaPPN: false, persenPPN: '11',
      kategoriAdditional: 'LAINNYA',
    })
    setInvoiceFile(null)
    setAddIsAdditional(false)
  }

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payItem) return
    setSubmittingPay(true)
    try {
      let buktiBayarUrl = ''
      if (payProofFile) {
        const fd = new FormData()
        fd.append('file', payProofFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (uploadData.success) buktiBayarUrl = uploadData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab-realisasi/${payItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusBayar: 'sudah_dibayar',
          tanggalBayar,
          ...(buktiBayarUrl ? { buktiBayarUrl } : {}),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembayaran dikonfirmasi', description: 'Status invoice diubah ke Sudah Dibayar' })
        setPayOpen(false)
        setPayItem(null)
        setPayProofFile(null)
        fetchRealisasi()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingPay(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-realisasi/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Realisasi dihapus' })
        setDeleteId(null)
        fetchRealisasi()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  const filtered = realisasi.filter(r => {
    if (!showAdditional && r.isAdditional) return false
    if (filterStatus !== 'all' && r.statusBayar !== filterStatus) return false
    return true
  })

  const totalBelumBayar = realisasi.filter(r => r.statusBayar === 'belum_dibayar').reduce((s, r) => s + r.jumlah, 0)
  const totalSudahBayar = realisasi.filter(r => r.statusBayar === 'sudah_dibayar').reduce((s, r) => s + r.jumlah, 0)
  const totalAll = realisasi.reduce((s, r) => s + r.jumlah, 0)

  if (loading) {
    return <div className="flex justify-center h-40 items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">Total Invoice</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(totalAll)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{realisasi.length} entri</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="p-4">
            <p className="text-xs text-rose-600 font-medium">Belum Dibayar</p>
            <p className="text-lg font-bold text-rose-800 mt-1">{formatCurrency(totalBelumBayar)}</p>
            <p className="text-[10px] text-rose-400 mt-0.5">{realisasi.filter(r => r.statusBayar === 'belum_dibayar').length} invoice</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium">Sudah Dibayar</p>
            <p className="text-lg font-bold text-emerald-800 mt-1">{formatCurrency(totalSudahBayar)}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">{realisasi.filter(r => r.statusBayar === 'sudah_dibayar').length} invoice</p>
          </CardContent>
        </Card>
      </div>

      {/* List Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Realisasi &amp; Invoice Vendor</CardTitle>
              <CardDescription>Catat invoice yang masuk dari vendor</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter status */}
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="belum_dibayar">Belum Dibayar</SelectItem>
                  <SelectItem value="sudah_dibayar">Sudah Dibayar</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" />
                Tambah Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p className="font-medium text-foreground">Belum ada realisasi</p>
              <p className="text-sm mt-1">Klik "Tambah Invoice" untuk mencatat realisasi pembelian</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const status = STATUS_BADGE[item.statusBayar] || STATUS_BADGE.belum_dibayar
                return (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Item / Category label */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.isAdditional ? (
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                              Biaya Tambahan: {item.kategoriAdditional}
                            </Badge>
                          ) : (
                            item.rabItem && (
                              <Badge variant="outline" className="text-[10px]">
                                {item.rabItem.topik.nama} → {item.rabItem.namaItem}
                              </Badge>
                            )
                          )}
                          <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                            {item.statusBayar === 'sudah_dibayar' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 mr-1" />
                            )}
                            {status.label}
                          </Badge>
                          {item.kenaPPN && (
                            <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200">
                              PPN {item.persenPPN}%
                            </Badge>
                          )}
                        </div>

                        {/* Vendor & Invoice */}
                        <div className="mt-1.5">
                          <p className="text-sm font-medium">
                            {item.vendor?.name || item.vendorNama || <span className="text-muted-foreground italic">Tanpa vendor</span>}
                          </p>
                          {item.nomorInvoice && (
                            <p className="text-xs text-muted-foreground">No. Invoice: {item.nomorInvoice}</p>
                          )}
                          {item.keterangan && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.keterangan}</p>
                          )}
                        </div>

                        {/* Date */}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Tanggal: {formatDate(item.tanggalInvoice)}
                          {item.tanggalBayar && ` · Dibayar: ${formatDate(item.tanggalBayar)}`}
                        </p>

                        {/* Links */}
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.fileBuktiUrl && (
                            <a href={item.fileBuktiUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-2.5 h-2.5" /> Invoice
                            </a>
                          )}
                          {item.buktiBayarUrl && (
                            <a href={item.buktiBayarUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="w-2.5 h-2.5" /> Bukti Bayar
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center sm:items-end sm:flex-col gap-3 sm:gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-base font-bold">{formatCurrency(item.jumlah)}</p>
                          {item.kenaPPN && (
                            <p className="text-[10px] text-blue-600">
                              +PPN {formatCurrency(item.jumlah * item.persenPPN / 100)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {item.statusBayar === 'belum_dibayar' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => { setPayItem(item); setPayOpen(true) }}
                            >
                              Bayar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); resetForm() } else setAddOpen(true) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Invoice Vendor</DialogTitle>
            <DialogDescription>Catat invoice/tagihan yang diterima dari vendor</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            {/* Tipe: RAB item atau biaya tambahan */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={!addIsAdditional ? 'default' : 'outline'}
                onClick={() => setAddIsAdditional(false)}
                className="flex-1"
              >
                Item RAB
              </Button>
              <Button
                type="button"
                size="sm"
                variant={addIsAdditional ? 'default' : 'outline'}
                onClick={() => setAddIsAdditional(true)}
                className="flex-1"
              >
                Biaya Tambahan
              </Button>
            </div>

            {addIsAdditional ? (
              <div className="space-y-2">
                <Label>Kategori Biaya Tambahan</Label>
                <Select value={form.kategoriAdditional} onValueChange={(v) => setForm({ ...form, kategoriAdditional: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKSESORI">Aksesori</SelectItem>
                    <SelectItem value="ONGKIR">Ongkos Kirim</SelectItem>
                    <SelectItem value="OPERASIONAL">Operasional</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya (konsumsi, gift, dll)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Item RAB <span className="text-destructive">*</span></Label>
                <Select value={form.rabItemId} onValueChange={(v) => setForm({ ...form, rabItemId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih item RAB..." /></SelectTrigger>
                  <SelectContent>
                    {topikOptions.length === 0 ? (
                      <SelectItem value="_none" disabled>Buat topik RAB terlebih dahulu</SelectItem>
                    ) : topikOptions.map((topik) => (
                      topik.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {topik.nama} → {item.namaItem}
                        </SelectItem>
                      ))
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Vendor */}
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih dari daftar (opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Vendor bebas (isi di bawah) —</SelectItem>
                  {vendorOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} {v.isPKP ? '(PKP)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(form.vendorId === '_none' || !form.vendorId) && (
                <Input
                  value={form.vendorNama}
                  onChange={(e) => setForm({ ...form, vendorNama: e.target.value })}
                  placeholder="Nama vendor (bebas)"
                />
              )}
            </div>

            {/* Invoice details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>No. Invoice</Label>
                <Input
                  value={form.nomorInvoice}
                  onChange={(e) => setForm({ ...form, nomorInvoice: e.target.value })}
                  placeholder="INV-001 (opsional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Invoice</Label>
                <Input
                  type="date"
                  value={form.tanggalInvoice}
                  onChange={(e) => setForm({ ...form, tanggalInvoice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nominal / Jumlah <span className="text-destructive">*</span></Label>
              <Input
                value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                placeholder="Contoh: 5000000"
                type="number"
                min="0"
              />
            </div>

            {/* PPN */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="kenaPPN"
                checked={form.kenaPPN}
                onChange={(e) => setForm({ ...form, kenaPPN: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="kenaPPN" className="cursor-pointer">Kena PPN</Label>
              {form.kenaPPN && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={form.persenPPN}
                    onChange={(e) => setForm({ ...form, persenPPN: e.target.value })}
                    className="w-16 h-7 text-xs"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </div>

            {/* File Invoice */}
            <div className="space-y-2">
              <Label>File Invoice (opsional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('invoiceFileInput')?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {invoiceFile ? invoiceFile.name : 'Upload PDF/Gambar'}
                </Button>
                <input
                  id="invoiceFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                />
                {invoiceFile && (
                  <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setInvoiceFile(null)}>
                    ✕ hapus
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); resetForm() }}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { if (!o) { setPayOpen(false); setPayItem(null); setPayProofFile(null) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              {payItem?.vendor?.name || payItem?.vendorNama || 'Vendor'} · {formatCurrency(payItem?.jumlah ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkPaid} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Tanggal Bayar</Label>
              <Input
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bukti Transfer (opsional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('proofFileInput')?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {payProofFile ? payProofFile.name : 'Upload Bukti'}
                </Button>
                <input
                  id="proofFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setPayProofFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setPayOpen(false); setPayItem(null); setPayProofFile(null) }}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingPay} className="bg-emerald-600 hover:bg-emerald-700">
                {submittingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Bayar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Realisasi</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus entri realisasi/invoice ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
