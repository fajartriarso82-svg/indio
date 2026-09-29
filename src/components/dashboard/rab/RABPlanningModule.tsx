'use client'

import React, { useState, useEffect, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Edit,
  Check,
  X,
  History,
  AlertTriangle,
  CornerDownRight,
  FileText,
  FileCheck,
  Receipt,
  CreditCard,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface RABRealisasiEntry {
  id: string
  jumlah: number
  statusBayar: string // 'belum_dibayar' | 'sudah_dibayar'
  vendorNama?: string
  nomorInvoice?: string
  tanggalInvoice?: string | Date
  tanggalBayar?: string | Date | null
  fileBuktiUrl?: string | null
  buktiBayarUrl?: string | null
  keterangan?: string | null
  createdAt?: string | Date
  vendor?: { id: string; name: string }
}

interface RABItem {
  id: string
  namaItem: string
  satuan: string
  volumeRencana: number
  hargaSatuanRencana: number
  jumlahRencana: number
  totalRealisasi: number
  selisih: number
  persenTerserap: number
  urutan: number
  _count?: { auditLogs: number }
  realisasi?: RABRealisasiEntry[]
}

interface RABTopik {
  id: string
  nama: string
  urutan: number
  items: RABItem[]
  totalRencanaTopik: number
  totalRealisasiTopik: number
  selisihTopik: number
}

interface RABPlanningProps {
  projectId: string
  projectStatus: string
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

const formatNumber = (v: number) =>
  new Intl.NumberFormat('id-ID').format(v)

const formatDate = (d: string | null | Date | undefined) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const parseFormattedNumber = (val: string | number): number => {
  if (typeof val === 'number') return val
  if (!val) return 0
  const clean = String(val).replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

const formatThousandSeparator = (val: string): string => {
  if (!val) return ''
  const clean = val.replace(/[^0-9,]/g, '')
  const parts = clean.split(',')
  const integerPart = parts[0] ? parseInt(parts[0], 10).toLocaleString('id-ID') : ''
  return parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart
}

export default function RABPlanningModule({ projectId, projectStatus }: RABPlanningProps) {
  const { toast } = useToast()
  const [topiks, setTopiks] = useState<RABTopik[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorOptions, setVendorOptions] = useState<any[]>([])

  // Expanded state (default: all expanded)
  const [expandedTopiks, setExpandedTopiks] = useState<Set<string>>(new Set())

  // New topik form
  const [addTopikOpen, setAddTopikOpen] = useState(false)
  const [newTopikNama, setNewTopikNama] = useState('')
  const [submittingTopik, setSubmittingTopik] = useState(false)

  // Edit topik inline
  const [editTopikId, setEditTopikId] = useState<string | null>(null)
  const [editTopikNama, setEditTopikNama] = useState('')

  // New item form
  const [addItemTopikId, setAddItemTopikId] = useState<string | null>(null)
  const [newItemForm, setNewItemForm] = useState({ namaItem: '', satuan: 'unit', volumeRencana: '1', hargaSatuanRencana: '0' })
  const [submittingItem, setSubmittingItem] = useState(false)

  // Edit item dialog
  const [editItemModal, setEditItemModal] = useState<{ topikId: string; item: RABItem } | null>(null)
  const [editItemForm, setEditItemForm] = useState({ namaItem: '', satuan: '', volumeRencana: '', hargaSatuanRencana: '' })
  const [submittingEditItem, setSubmittingEditItem] = useState(false)

  // Delete dialogs
  const [deleteTopikId, setDeleteTopikId] = useState<string | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<{ topikId: string; itemId: string } | null>(null)

  // Realisasi per item
  const [addRealisasiItem, setAddRealisasiItem] = useState<RABItem | null>(null)
  const [realisasiVendorType, setRealisasiVendorType] = useState<'EXISTING' | 'NEW'>('EXISTING')
  const [realisasiForm, setRealisasiForm] = useState({
    vendorId: '',
    vendorNama: '',
    nomorInvoice: '',
    tanggalInvoice: new Date().toISOString().split('T')[0],
    jumlah: '0',
    statusBayar: 'belum_dibayar', // 'belum_dibayar' | 'sudah_dibayar'
    tanggalBayar: new Date().toISOString().split('T')[0],
    keterangan: '',
  })
  const [realisasiInvoiceFile, setRealisasiInvoiceFile] = useState<File | null>(null)
  const [realisasiPayProofFile, setRealisasiPayProofFile] = useState<File | null>(null)
  const [submittingRealisasi, setSubmittingRealisasi] = useState(false)

  // Konfirmasi Bayar Realisasi
  const [payRealisasiItem, setPayRealisasiItem] = useState<any | null>(null)
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payProofFile, setPayProofFile] = useState<File | null>(null)
  const [payNotes, setPayNotes] = useState('')
  const [submittingPay, setSubmittingPay] = useState(false)

  // Hapus Realisasi
  const [deleteRealisasiId, setDeleteRealisasiId] = useState<string | null>(null)
  const [deletingRealisasi, setDeletingRealisasi] = useState(false)

  // Audit log modal
  const [auditModalItem, setAuditModalItem] = useState<RABItem | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}/rab-topik`)
      const data = await res.json()
      if (data.success) {
        setTopiks(data.data.topiks || [])
        // Auto-expand all topiks
        if (data.data.topiks && data.data.topiks.length > 0) {
          setExpandedTopiks(new Set(data.data.topiks.map((t: RABTopik) => t.id)))
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat data RAB', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
    fetch('/api/vendors')
      .then((r) => r.json())
      .then((d) => { if (d.success) setVendorOptions(d.data) })
      .catch(() => {})
  }, [fetchData])

  const toggleTopik = (id: string) => {
    setExpandedTopiks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ─── Topik Handlers ───
  const handleAddTopik = async () => {
    if (!newTopikNama.trim()) return
    setSubmittingTopik(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-topik`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newTopikNama }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Topik ditambahkan' })
        setNewTopikNama('')
        setAddTopikOpen(false)
        await fetchData()
        setExpandedTopiks((prev) => new Set([...prev, data.data.id]))
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingTopik(false)
    }
  }

  const handleEditTopik = async (topikId: string) => {
    if (!editTopikNama.trim()) return
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-topik/${topikId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: editTopikNama }),
      })
      const data = await res.json()
      if (data.success) {
        setEditTopikId(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  const handleDeleteTopik = async () => {
    if (!deleteTopikId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-topik/${deleteTopikId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Topik dihapus' })
        setDeleteTopikId(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  // ─── Item Handlers ───
  const handleAddItem = async (topikId: string) => {
    if (!newItemForm.namaItem.trim()) {
      toast({ title: 'Error', description: 'Nama item wajib diisi', variant: 'destructive' })
      return
    }
    setSubmittingItem(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-topik/${topikId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaItem: newItemForm.namaItem,
          satuan: newItemForm.satuan || 'unit',
          volumeRencana: parseFormattedNumber(newItemForm.volumeRencana),
          hargaSatuanRencana: parseFormattedNumber(newItemForm.hargaSatuanRencana),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Item ditambahkan' })
        setAddItemTopikId(null)
        setNewItemForm({ namaItem: '', satuan: 'unit', volumeRencana: '1', hargaSatuanRencana: '0' })
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleEditItem = async () => {
    if (!editItemModal) return
    setSubmittingEditItem(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/rab-topik/${editItemModal.topikId}/items/${editItemModal.item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaItem: editItemForm.namaItem,
            satuan: editItemForm.satuan,
            volumeRencana: parseFormattedNumber(editItemForm.volumeRencana),
            hargaSatuanRencana: parseFormattedNumber(editItemForm.hargaSatuanRencana),
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Item diperbarui' })
        setEditItemModal(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingEditItem(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemId) return
    try {
      const res = await fetch(
        `/api/projects/${projectId}/rab-topik/${deleteItemId.topikId}/items/${deleteItemId.itemId}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Item dihapus' })
        setDeleteItemId(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  // ─── Realisasi Handlers ───
  const openAddRealisasi = (item: RABItem) => {
    setAddRealisasiItem(item)
    setRealisasiVendorType('EXISTING')
    setRealisasiForm({
      vendorId: '',
      vendorNama: '',
      nomorInvoice: '',
      tanggalInvoice: new Date().toISOString().split('T')[0],
      jumlah: formatThousandSeparator(String(item.hargaSatuanRencana || 0)),
      statusBayar: 'belum_dibayar',
      tanggalBayar: new Date().toISOString().split('T')[0],
      keterangan: '',
    })
    setRealisasiInvoiceFile(null)
    setRealisasiPayProofFile(null)
  }

  const handleCreateRealisasi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addRealisasiItem) return
    const numAmount = parseFormattedNumber(realisasiForm.jumlah)
    if (numAmount <= 0) {
      toast({ title: 'Validasi Gagal', description: 'Nominal realisasi harus lebih dari 0', variant: 'destructive' })
      return
    }

    setSubmittingRealisasi(true)
    try {
      let fileBuktiUrl = ''
      let buktiBayarUrl = ''

      if (realisasiInvoiceFile) {
        const fd = new FormData()
        fd.append('file', realisasiInvoiceFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) fileBuktiUrl = upData.url
      }

      if (realisasiPayProofFile && realisasiForm.statusBayar === 'sudah_dibayar') {
        const fd = new FormData()
        fd.append('file', realisasiPayProofFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) buktiBayarUrl = upData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab-realisasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rabItemId: addRealisasiItem.id,
          vendorId: realisasiVendorType === 'EXISTING' ? (realisasiForm.vendorId || null) : null,
          vendorNama: realisasiVendorType === 'NEW' ? realisasiForm.vendorNama : null,
          nomorInvoice: realisasiForm.nomorInvoice || null,
          tanggalInvoice: realisasiForm.tanggalInvoice,
          jumlah: numAmount,
          keterangan: realisasiForm.keterangan || null,
          statusBayar: realisasiForm.statusBayar,
          tanggalBayar: realisasiForm.statusBayar === 'sudah_dibayar' ? realisasiForm.tanggalBayar : null,
          fileBuktiUrl: fileBuktiUrl || null,
          buktiBayarUrl: buktiBayarUrl || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'Realisasi Berhasil Dicatat', description: 'Pengeluaran/invoice berhasil dicatat.' })
        setAddRealisasiItem(null)
        setRealisasiInvoiceFile(null)
        setRealisasiPayProofFile(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setSubmittingRealisasi(false)
    }
  }

  const openPayRealisasiModal = (realisasi: any) => {
    setPayRealisasiItem(realisasi)
    setPayDate(new Date().toISOString().split('T')[0])
    setPayProofFile(null)
    setPayNotes(realisasi.keterangan || '')
  }

  const handleConfirmPayRealisasi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payRealisasiItem) return
    setSubmittingPay(true)
    try {
      let buktiBayarUrl = ''
      if (payProofFile) {
        const fd = new FormData()
        fd.append('file', payProofFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) buktiBayarUrl = upData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab-realisasi/${payRealisasiItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusBayar: 'sudah_dibayar',
          tanggalBayar: payDate,
          ...(buktiBayarUrl ? { buktiBayarUrl } : {}),
          ...(payNotes ? { keterangan: payNotes } : {}),
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembayaran Dikonfirmasi', description: 'Status telah diperbarui menjadi Sudah Dibayar (Lunas).' })
        setPayRealisasiItem(null)
        setPayProofFile(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setSubmittingPay(false)
    }
  }

  const handleDeleteRealisasi = async (realisasiId: string) => {
    setDeletingRealisasi(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-realisasi/${realisasiId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Dihapus', description: 'Transaksi realisasi berhasil dihapus.' })
        setDeleteRealisasiId(null)
        fetchData()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menghapus transaksi', variant: 'destructive' })
    } finally {
      setDeletingRealisasi(false)
    }
  }

  const openAuditLog = async (item: RABItem) => {
    setAuditModalItem(item)
    setLoadingAudit(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/rab-topik`)
      const d = await res.json()
      if (d.success) {
        for (const topik of d.data.topiks) {
          const found = topik.items.find((i: any) => i.id === item.id)
          if (found && found.auditLogs) {
            setAuditLogs(found.auditLogs)
            break
          }
        }
      }
    } catch {
      setAuditLogs([])
    } finally {
      setLoadingAudit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isReadOnly = projectStatus === 'COMPLETED' || projectStatus === 'CANCELLED'

  return (
    <div className="space-y-6">
      {/* Tombol Tambah Topik */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Daftar Topik & Item RAB</h2>
          <p className="text-xs text-muted-foreground">
            Lacak rencana anggaran, realisasi belanja/invoice vendor, dan bukti pembayaran setiap item pekerjaan.
          </p>
        </div>
        {!isReadOnly && (
          <Button size="sm" onClick={() => setAddTopikOpen(true)} className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Tambah Topik
          </Button>
        )}
      </div>

      {topiks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <p className="font-semibold text-foreground">Belum ada topik RAB</p>
            <p className="text-xs mt-1">Tambahkan topik pertama untuk menyusun item pekerjaan proyek.</p>
            {!isReadOnly && (
              <Button size="sm" className="mt-4" onClick={() => setAddTopikOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Tambah Topik
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {topiks.map((topik, topikIdx) => {
            const isExpanded = expandedTopiks.has(topik.id)
            const isOverBudget = topik.totalRealisasiTopik > topik.totalRencanaTopik

            return (
              <Card key={topik.id} className="overflow-hidden border border-border shadow-xs">
                {/* Header Topik */}
                <CardHeader className="p-3 sm:px-4 bg-muted/40 border-b border-border/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                      onClick={() => toggleTopik(topik.id)}
                    >
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      </button>

                      {editTopikId === topik.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editTopikNama}
                            onChange={(e) => setEditTopikNama(e.target.value)}
                            className="h-7 text-xs w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditTopik(topik.id)
                              if (e.key === 'Escape') setEditTopikId(null)
                            }}
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditTopik(topik.id)}>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTopikId(null)}>
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {topikIdx + 1}. {topik.nama}
                          </span>
                          <span className="text-[11px] text-muted-foreground">({topik.items.length} item)</span>
                        </div>
                      )}
                    </div>

                    {/* Ringkasan Angka Topik & Aksi */}
                    <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground text-[10px] block">RAB:</span>
                        <span className="font-bold text-foreground">{formatCurrency(topik.totalRencanaTopik)}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground text-[10px] block">Realisasi:</span>
                        <span className="font-bold text-destructive">{formatCurrency(topik.totalRealisasiTopik)}</span>
                      </div>
                      {topik.totalRealisasiTopik > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${isOverBudget ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-emerald-400 text-emerald-700 bg-emerald-50'}`}
                        >
                          {isOverBudget ? '⚠ Over Budget' : '✓ Aman'}
                        </Badge>
                      )}

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => {
                              setAddItemTopikId(topik.id)
                              setNewItemForm({ namaItem: '', satuan: 'unit', volumeRencana: '1', hargaSatuanRencana: '0' })
                            }}
                          >
                            <Plus className="w-3 h-3" />
                            Tambah Item
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground"
                            onClick={() => { setEditTopikId(topik.id); setEditTopikNama(topik.nama) }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTopikId(topik.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Konten Item Topik */}
                {isExpanded && (
                  <CardContent className="p-0">
                    {topik.items.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        <p>Belum ada item pekerjaan di topik ini.</p>
                        {!isReadOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs"
                            onClick={() => {
                              setAddItemTopikId(topik.id)
                              setNewItemForm({ namaItem: '', satuan: 'unit', volumeRencana: '1', hargaSatuanRencana: '0' })
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah Item Pekerjaan
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* ===== MOBILE VIEW: Card List ===== */}
                        <div className="md:hidden divide-y-4 divide-slate-200 dark:divide-slate-800">
                          {topik.items.map((item, itemIdx) => {
                            const isEven = itemIdx % 2 === 0
                            const groupBg = isEven ? 'bg-background' : 'bg-slate-50/70 dark:bg-slate-900/30'
                            return (
                              <div key={item.id} className={`p-4 space-y-3 ${groupBg}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 border border-primary/20">
                                      #{itemIdx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-foreground truncate">{item.namaItem}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Vol: {formatNumber(item.volumeRencana)} {item.satuan} @ {formatCurrency(item.hargaSatuanRencana)}
                                      </p>
                                      {/* Status Pembayaran Item */}
                                      <div className="mt-1.5">
                                        {(() => {
                                          const realisasiList = item.realisasi || []
                                          if (realisasiList.length === 0) {
                                            return <span className="text-[10px] text-muted-foreground italic">Belum ada realisasi</span>
                                          }
                                          const unpaidCount = realisasiList.filter((r) => r.statusBayar !== 'sudah_dibayar').length
                                          if (unpaidCount > 0) {
                                            return (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-2 py-0.5 font-semibold text-amber-800 bg-amber-50 border-amber-300 gap-1 inline-flex items-center"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Menunggu Bayar (Request) {unpaidCount > 1 ? `(${unpaidCount})` : ''}
                                              </Badge>
                                            )
                                          }
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] px-2 py-0.5 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1 inline-flex items-center"
                                            >
                                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                              Sudah Dibayar (Lunas)
                                            </Badge>
                                          )
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  {!isReadOnly && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 shrink-0 text-xs gap-1"
                                      onClick={() => openAddRealisasi(item)}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Realisasi
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs bg-card/60 p-2.5 rounded-lg border border-border/60">
                                  <div>
                                    <span className="text-muted-foreground text-[10px] block">Total Rencana:</span>
                                    <span className="font-semibold text-foreground">{formatCurrency(item.jumlahRencana)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-[10px] block">Realisasi:</span>
                                    <span className="font-semibold text-destructive">{formatCurrency(item.totalRealisasi)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground text-[10px] block">Selisih:</span>
                                    <span className={`font-semibold ${item.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {formatCurrency(item.selisih)}
                                    </span>
                                  </div>
                                </div>

                                {/* Riwayat Transaksi Realisasi (Mobile) */}
                                {item.realisasi && item.realisasi.length > 0 && (
                                  <div className="ml-2 pl-3 border-l-2 border-primary/50 space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                      <CornerDownRight className="w-3.5 h-3.5" />
                                      <span>Riwayat Realisasi ({item.realisasi.length})</span>
                                    </div>
                                    <div className="rounded-md border border-border bg-card divide-y divide-border">
                                      {item.realisasi.map((r) => (
                                        <div key={r.id} className="p-2.5 space-y-2 text-xs">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <p className="font-semibold truncate text-foreground">
                                                {r.vendor?.name || r.vendorNama || 'Tanpa vendor'}
                                              </p>
                                              <p className="font-bold text-foreground mt-0.5">{formatCurrency(r.jumlah)}</p>
                                            </div>
                                            {r.statusBayar === 'sudah_dibayar' ? (
                                              <Badge
                                                variant="outline"
                                                className="shrink-0 text-[10px] px-2 py-0.5 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1 inline-flex items-center"
                                              >
                                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                                Sudah Dibayar (Lunas)
                                              </Badge>
                                            ) : (
                                              <Badge
                                                variant="outline"
                                                className="shrink-0 text-[10px] px-2 py-0.5 font-semibold text-amber-800 bg-amber-50 border-amber-300 gap-1 inline-flex items-center"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Menunggu Bayar (Request)
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                            <span className="bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded border border-border/60">
                                              📅 {formatDate(r.tanggalInvoice || r.createdAt)}
                                            </span>
                                            {r.statusBayar === 'sudah_dibayar' ? (
                                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                                                ✓ {formatDate(r.tanggalBayar)}
                                              </span>
                                            ) : (
                                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                ⏳ Menunggu Bayar
                                              </span>
                                            )}
                                          </div>

                                          {/* Catatan Kecil */}
                                          {r.keterangan && (
                                            <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2 py-1 rounded">
                                              💬 {r.keterangan}
                                            </div>
                                          )}

                                          <div className="flex items-center justify-end gap-2.5 pt-1">
                                            {r.fileBuktiUrl && (
                                              <a href={r.fileBuktiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                [Inv]
                                              </a>
                                            )}
                                            {r.buktiBayarUrl && (
                                              <a href={r.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                [Bukti]
                                              </a>
                                            )}
                                            {!isReadOnly && r.statusBayar !== 'sudah_dibayar' && (
                                              <Button
                                                size="sm"
                                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => openPayRealisasiModal(r)}
                                              >
                                                Konfirmasi Bayar
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* ===== DESKTOP VIEW: Tabel Mirip Pengadaan ===== */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/60 border-b-2 border-border text-xs">
                                <TableHead className="w-[40px] text-center">#</TableHead>
                                <TableHead className="min-w-[190px]">Item Pekerjaan</TableHead>
                                <TableHead className="text-right min-w-[130px]">Volume &amp; Satuan</TableHead>
                                <TableHead className="text-right min-w-[130px]">Harga Satuan (RAB)</TableHead>
                                <TableHead className="text-right min-w-[130px]">Total Rencana (RAB)</TableHead>
                                <TableHead className="text-right min-w-[130px]">Total Realisasi</TableHead>
                                <TableHead className="text-center min-w-[180px]">Status Pembayaran</TableHead>
                                <TableHead className="text-right min-w-[130px]">Selisih / Sisa</TableHead>
                                <TableHead className="text-right min-w-[110px]">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topik.items.map((item, itemIdx) => {
                                const hasRealisasi = item.realisasi && item.realisasi.length > 0
                                const isEven = itemIdx % 2 === 0
                                const groupBg = isEven ? 'bg-background' : 'bg-slate-50/70 dark:bg-slate-900/30'

                                return (
                                  <Fragment key={item.id}>
                                    {/* Parent Item Row */}
                                    <TableRow className={`${groupBg} ${!hasRealisasi ? 'border-b-4 border-slate-200 dark:border-slate-800' : 'border-b-0'}`}>
                                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                                          {itemIdx + 1}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-semibold text-foreground text-sm">{item.namaItem}</div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">Topik: {topik.nama}</div>
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        <span className="font-semibold text-foreground">{formatNumber(item.volumeRencana)}</span>{' '}
                                        <span className="text-xs text-muted-foreground">{item.satuan}</span>
                                      </TableCell>
                                      <TableCell className="text-right text-sm">{formatCurrency(item.hargaSatuanRencana)}</TableCell>
                                      <TableCell className="text-right text-sm font-semibold text-foreground">{formatCurrency(item.jumlahRencana)}</TableCell>
                                      <TableCell className="text-right text-sm font-semibold text-destructive">
                                        {formatCurrency(item.totalRealisasi)}
                                      </TableCell>
                                      {/* Status Pembayaran di Row Item Induk */}
                                      <TableCell className="text-center">
                                        {(() => {
                                          const realisasiList = item.realisasi || []
                                          if (realisasiList.length === 0) {
                                            return <span className="text-xs text-muted-foreground italic">— Belum ada transaksi —</span>
                                          }
                                          const unpaidCount = realisasiList.filter((r) => r.statusBayar !== 'sudah_dibayar').length
                                          if (unpaidCount > 0) {
                                            return (
                                              <Badge
                                                variant="outline"
                                                className="text-xs px-2.5 py-1 font-semibold text-amber-800 bg-amber-50 border-amber-300 gap-1.5 inline-flex items-center"
                                              >
                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                Menunggu Bayar (Request)
                                                {unpaidCount > 1 && <span className="text-[10px] ml-0.5">({unpaidCount})</span>}
                                              </Badge>
                                            )
                                          }
                                          return (
                                            <Badge
                                              variant="outline"
                                              className="text-xs px-2.5 py-1 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1.5 inline-flex items-center"
                                            >
                                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                              Sudah Dibayar (Lunas)
                                            </Badge>
                                          )
                                        })()}
                                      </TableCell>
                                      <TableCell className={`text-right text-sm font-semibold ${item.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(item.selisih)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {!isReadOnly && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 text-xs px-2.5 gap-1"
                                              onClick={() => openAddRealisasi(item)}
                                              title="Catat pengeluaran / invoice vendor untuk item ini"
                                            >
                                              <Plus className="w-3.5 h-3.5 mr-0.5" />
                                              Realisasi
                                            </Button>
                                          )}
                                          {!isReadOnly && (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-muted-foreground"
                                                onClick={() => {
                                                  setEditItemModal({ topikId: topik.id, item })
                                                  setEditItemForm({
                                                    namaItem: item.namaItem,
                                                    satuan: item.satuan,
                                                    volumeRencana: String(item.volumeRencana),
                                                    hargaSatuanRencana: formatThousandSeparator(String(item.hargaSatuanRencana)),
                                                  })
                                                }}
                                              >
                                                <Edit className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteItemId({ topikId: topik.id, itemId: item.id })}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          )}
                                          {(item._count?.auditLogs ?? 0) > 0 && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-muted-foreground"
                                              onClick={() => openAuditLog(item)}
                                              title="Riwayat Perubahan"
                                            >
                                              <History className="w-3.5 h-3.5" />
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>

                                    {/* Child Row: Riwayat Realisasi / Invoice */}
                                    {hasRealisasi && (
                                      <TableRow className={`${groupBg} border-b-4 border-slate-200 dark:border-slate-800`}>
                                        <TableCell colSpan={9} className="pt-0 pb-3 px-3 sm:px-5">
                                          <div className="ml-7 rounded-lg border border-border/80 bg-background/95 dark:bg-card/90 shadow-2xs border-l-4 border-l-primary p-3 space-y-2">
                                            {/* Sub-header penjelas relasi */}
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 pb-1 border-b border-border/40">
                                              <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                              <span>Riwayat Realisasi untuk:</span>
                                              <span className="text-primary font-bold underline decoration-primary/40 underline-offset-2">{item.namaItem}</span>
                                              <span className="text-[11px] text-muted-foreground font-normal ml-1">
                                                ({item.realisasi!.length} transaksi)
                                              </span>
                                            </div>

                                            {/* List Transaksi Realisasi */}
                                            <div className="space-y-1.5">
                                              {item.realisasi!.map((r) => (
                                                <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs py-1.5 border-b border-border/40 last:border-0">
                                                  {r.statusBayar === 'sudah_dibayar' ? (
                                                    <Badge
                                                      variant="outline"
                                                      className="shrink-0 text-xs px-2.5 py-0.5 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1.5 inline-flex items-center"
                                                    >
                                                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                      Sudah Dibayar (Lunas)
                                                    </Badge>
                                                  ) : (
                                                    <Badge
                                                      variant="outline"
                                                      className="shrink-0 text-xs px-2.5 py-0.5 font-semibold text-amber-800 bg-amber-50 border-amber-300 gap-1.5 inline-flex items-center"
                                                    >
                                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                      Menunggu Bayar (Request)
                                                    </Badge>
                                                  )}

                                                  <span className="font-semibold text-foreground">{r.vendor?.name || r.vendorNama || 'Tanpa vendor'}</span>
                                                  {r.nomorInvoice && (
                                                    <span className="text-muted-foreground text-[11px]">({r.nomorInvoice})</span>
                                                  )}
                                                  <span className="font-semibold text-foreground">= {formatCurrency(r.jumlah)}</span>

                                                  {/* Tanggal Pengajuan & Tanggal Sudah Dibayar */}
                                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                    <span className="bg-muted/70 text-muted-foreground px-2 py-0.5 rounded border border-border/60">
                                                      📅 Diajukan: <strong className="text-foreground font-medium">{formatDate(r.tanggalInvoice || r.createdAt)}</strong>
                                                    </span>
                                                    {r.statusBayar === 'sudah_dibayar' ? (
                                                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                                        ✓ Dibayar: {formatDate(r.tanggalBayar)}
                                                      </span>
                                                    ) : (
                                                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        ⏳ Menunggu Bayar
                                                      </span>
                                                    )}
                                                  </div>

                                                  {/* Catatan Kecil (dibayar cash, ambil cash toko, dll.) */}
                                                  {r.keterangan && (
                                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded text-[11px] font-medium">
                                                      💬 {r.keterangan}
                                                    </span>
                                                  )}

                                                  {/* Actions & Links */}
                                                  <div className="flex items-center gap-2 ml-auto">
                                                    {r.fileBuktiUrl && (
                                                      <a href={r.fileBuktiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                        [Bukti Invoice]
                                                      </a>
                                                    )}
                                                    {r.buktiBayarUrl && (
                                                      <a href={r.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                        [Bukti Transfer]
                                                      </a>
                                                    )}
                                                    {!isReadOnly && r.statusBayar !== 'sudah_dibayar' && (
                                                      <Button
                                                        size="sm"
                                                        className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => openPayRealisasiModal(r)}
                                                      >
                                                        Konfirmasi Bayar
                                                      </Button>
                                                    )}
                                                    {!isReadOnly && (
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDeleteRealisasiId(r.id)}
                                                        title="Hapus transaksi ini"
                                                      >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </Fragment>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── DIALOG: Tambah Topik ─── */}
      <Dialog open={addTopikOpen} onOpenChange={setAddTopikOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Topik RAB</DialogTitle>
            <DialogDescription>Topik mengelompokkan item pekerjaan (misal: Material, Tenaga Kerja, Ongkir)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Nama Topik *</Label>
              <Input
                value={newTopikNama}
                onChange={(e) => setNewTopikNama(e.target.value)}
                placeholder="misal: Pekerjaan Persiapan, Material & Bahan..."
                className="h-9 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopik() }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddTopikOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleAddTopik} disabled={submittingTopik || !newTopikNama.trim()}>
              {submittingTopik ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Simpan Topik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Tambah Item Pekerjaan ─── */}
      <Dialog open={!!addItemTopikId} onOpenChange={(open) => { if (!open) setAddItemTopikId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Item Pekerjaan</DialogTitle>
            <DialogDescription>Masukkan rincian item, volume rencana, dan harga satuan rencana</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Nama Item / Uraian Pekerjaan *</Label>
              <Input
                value={newItemForm.namaItem}
                onChange={(e) => setNewItemForm({ ...newItemForm, namaItem: e.target.value })}
                placeholder="misal: Cat Dinding Dulux, Semen Padang, Jasa Pemasangan..."
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Satuan *</Label>
                <Input
                  value={newItemForm.satuan}
                  onChange={(e) => setNewItemForm({ ...newItemForm, satuan: e.target.value })}
                  placeholder="unit, m², hari, ls, sak..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Volume Target *</Label>
                <Input
                  value={newItemForm.volumeRencana}
                  onChange={(e) => setNewItemForm({ ...newItemForm, volumeRencana: e.target.value })}
                  placeholder="1"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Harga Satuan Rencana (Rp) *</Label>
              <Input
                value={newItemForm.hargaSatuanRencana}
                onChange={(e) => setNewItemForm({ ...newItemForm, hargaSatuanRencana: formatThousandSeparator(e.target.value) })}
                placeholder="0"
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg text-xs flex justify-between items-center">
              <span className="text-muted-foreground">Total Rencana:</span>
              <span className="font-bold text-foreground">
                {formatCurrency(parseFormattedNumber(newItemForm.volumeRencana) * parseFormattedNumber(newItemForm.hargaSatuanRencana))}
              </span>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddItemTopikId(null)}>Batal</Button>
            <Button
              size="sm"
              onClick={() => addItemTopikId && handleAddItem(addItemTopikId)}
              disabled={submittingItem || !newItemForm.namaItem.trim()}
            >
              {submittingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Tambah Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Edit Item Pekerjaan ─── */}
      <Dialog open={!!editItemModal} onOpenChange={(open) => { if (!open) setEditItemModal(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item Pekerjaan</DialogTitle>
            <DialogDescription>Perbarui nama item, satuan, target volume, atau harga satuan</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Nama Item *</Label>
              <Input
                value={editItemForm.namaItem}
                onChange={(e) => setEditItemForm({ ...editItemForm, namaItem: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Satuan *</Label>
                <Input
                  value={editItemForm.satuan}
                  onChange={(e) => setEditItemForm({ ...editItemForm, satuan: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Volume Target *</Label>
                <Input
                  value={editItemForm.volumeRencana}
                  onChange={(e) => setEditItemForm({ ...editItemForm, volumeRencana: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Harga Satuan Rencana (Rp) *</Label>
              <Input
                value={editItemForm.hargaSatuanRencana}
                onChange={(e) => setEditItemForm({ ...editItemForm, hargaSatuanRencana: formatThousandSeparator(e.target.value) })}
                className="h-9 text-xs font-semibold"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditItemModal(null)}>Batal</Button>
            <Button size="sm" onClick={handleEditItem} disabled={submittingEditItem}>
              {submittingEditItem ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Tambah Realisasi / Pengeluaran Item ─── */}
      <Dialog open={!!addRealisasiItem} onOpenChange={(open) => { if (!open) setAddRealisasiItem(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Catat Realisasi / Invoice Vendor
            </DialogTitle>
            <DialogDescription>
              Catat tagihan invoice, nota toko, atau pengeluaran aktual untuk item ini.
            </DialogDescription>
          </DialogHeader>

          {addRealisasiItem && (
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border border-border/60">
              <div className="font-semibold text-foreground text-sm">{addRealisasiItem.namaItem}</div>
              <div className="flex flex-wrap items-center justify-between text-muted-foreground gap-2 pt-1 border-t border-border/40">
                <span>Rencana: <strong className="text-foreground">{formatNumber(addRealisasiItem.volumeRencana)} {addRealisasiItem.satuan}</strong> ({formatCurrency(addRealisasiItem.jumlahRencana)})</span>
                <span>Sudah Terealisasi: <strong className="text-destructive font-semibold">{formatCurrency(addRealisasiItem.totalRealisasi)}</strong></span>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateRealisasi} className="space-y-4 pt-1">
            {/* Vendor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Vendor / Toko / Pihak Terkait</Label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRealisasiVendorType('EXISTING')}
                    className={`hover:underline ${realisasiVendorType === 'EXISTING' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                  >
                    Pilih Database
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setRealisasiVendorType('NEW')}
                    className={`hover:underline ${realisasiVendorType === 'NEW' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                  >
                    Input Bebas
                  </button>
                </div>
              </div>

              {realisasiVendorType === 'EXISTING' ? (
                <Select
                  value={realisasiForm.vendorId}
                  onValueChange={(val) => setRealisasiForm((prev) => ({ ...prev, vendorId: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih vendor dari database..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-9 text-xs"
                  placeholder="Nama toko / tukang / vendor bebas..."
                  value={realisasiForm.vendorNama}
                  onChange={(e) => setRealisasiForm((prev) => ({ ...prev, vendorNama: e.target.value }))}
                />
              )}
            </div>

            {/* Nomor Invoice & Nominal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nomor Invoice / Nota (Opsional)</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="INV-001, Nota Toko..."
                  value={realisasiForm.nomorInvoice}
                  onChange={(e) => setRealisasiForm((prev) => ({ ...prev, nomorInvoice: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nominal Realisasi (Rp) *</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">Rp</span>
                  <Input
                    className="pl-8 h-9 text-xs font-bold"
                    placeholder="0"
                    value={realisasiForm.jumlah}
                    onChange={(e) => setRealisasiForm((prev) => ({ ...prev, jumlah: formatThousandSeparator(e.target.value) }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tanggal Diajukan & Status Bayar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Pengajuan / Nota *</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={realisasiForm.tanggalInvoice}
                  onChange={(e) => setRealisasiForm((prev) => ({ ...prev, tanggalInvoice: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status Pembayaran</Label>
                <Select
                  value={realisasiForm.statusBayar}
                  onValueChange={(val) => setRealisasiForm((prev) => ({ ...prev, statusBayar: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_dibayar">⏳ Menunggu Bayar (Request)</SelectItem>
                    <SelectItem value="sudah_dibayar">✓ Sudah Dibayar (Lunas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Jika langsung lunas, input tanggal bayar & bukti transfer */}
            {realisasiForm.statusBayar === 'sudah_dibayar' && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-emerald-800">Tanggal Dana Dibayarkan</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs bg-background"
                    value={realisasiForm.tanggalBayar}
                    onChange={(e) => setRealisasiForm((prev) => ({ ...prev, tanggalBayar: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-emerald-800">Upload Bukti Transfer / Pembayaran</Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    className="h-8 text-xs bg-background"
                    onChange={(e) => setRealisasiPayProofFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}

            {/* Upload File Bukti Invoice / Nota */}
            <div className="space-y-1">
              <Label className="text-xs">Upload File Invoice / Nota dari Vendor</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="h-8 text-xs"
                onChange={(e) => setRealisasiInvoiceFile(e.target.files?.[0] || null)}
              />
              <p className="text-[10px] text-muted-foreground">Foto nota toko, kuitansi belanja, atau PDF invoice tagihan.</p>
            </div>

            {/* Catatan Tambahan (biasanya dicatat dibayar cash, ambil cash toko, dll.) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Catatan Tambahan / Keterangan Pembayaran
              </Label>
              <Textarea
                className="text-xs h-16 resize-none"
                placeholder="misal: dibayar cash dari kas toko, transfer BCA, nota bon gantung..."
                value={realisasiForm.keterangan}
                onChange={(e) => setRealisasiForm((prev) => ({ ...prev, keterangan: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">
                Tuliskan informasi khusus seperti sumber dana (ambil cash toko, bayar tunai, dll).
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddRealisasiItem(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submittingRealisasi} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submittingRealisasi ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Simpan Realisasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: Konfirmasi Bayar Realisasi ─── */}
      <Dialog open={!!payRealisasiItem} onOpenChange={(open) => { if (!open) setPayRealisasiItem(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              Konfirmasi Pembayaran
            </DialogTitle>
            <DialogDescription>
              Konfirmasi pelunasan pengeluaran / invoice vendor ini.
            </DialogDescription>
          </DialogHeader>

          {payRealisasiItem && (
            <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">{payRealisasiItem.vendor?.name || payRealisasiItem.vendorNama || 'Tanpa vendor'}</span>
                <span className="font-bold text-foreground text-sm">{formatCurrency(payRealisasiItem.jumlah)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Diajukan: {formatDate(payRealisasiItem.tanggalInvoice || payRealisasiItem.createdAt)}
                {payRealisasiItem.nomorInvoice ? ` · Inv: ${payRealisasiItem.nomorInvoice}` : ''}
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmPayRealisasi} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Tanggal Sudah Dibayar *</Label>
              <Input
                type="date"
                className="h-9 text-xs"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Upload Bukti Transfer / Resi Pembayaran</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="h-8 text-xs"
                onChange={(e) => setPayProofFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Catatan Tambahan</Label>
              <Input
                className="h-9 text-xs"
                placeholder="misal: dibayar cash toko, mutasi Mandiri..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayRealisasiItem(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submittingPay} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submittingPay ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Konfirmasi &amp; Lunas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── CONFIRM: Hapus Topik ─── */}
      <AlertDialog open={!!deleteTopikId} onOpenChange={(open) => { if (!open) setDeleteTopikId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Hapus Topik RAB?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh item pekerjaan di dalam topik ini akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteTopik}>
              Hapus Topik
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── CONFIRM: Hapus Item ─── */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => { if (!open) setDeleteItemId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Hapus Item Pekerjaan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item pekerjaan ini dari RAB?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteItem}>
              Hapus Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── CONFIRM: Hapus Realisasi ─── */}
      <AlertDialog open={!!deleteRealisasiId} onOpenChange={(open) => { if (!open) setDeleteRealisasiId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Hapus Transaksi Realisasi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan pengeluaran/invoice ini? Total realisasi akan dikurangi kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRealisasi}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletingRealisasi}
              onClick={async (e) => {
                e.preventDefault()
                if (deleteRealisasiId) await handleDeleteRealisasi(deleteRealisasiId)
              }}
            >
              {deletingRealisasi ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── MODAL: Audit Log Item ─── */}
      <Dialog open={!!auditModalItem} onOpenChange={(open) => { if (!open) setAuditModalItem(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Riwayat Perubahan Item
            </DialogTitle>
            <DialogDescription>{auditModalItem?.namaItem}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {loadingAudit ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : auditLogs.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">Belum ada riwayat perubahan.</p>
            ) : (
              <ScrollArea className="max-h-60">
                <div className="space-y-2 text-xs">
                  {auditLogs.map((log: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg border border-border bg-muted/20">
                      <div className="flex justify-between text-muted-foreground text-[10px]">
                        <span>{formatDate(log.createdAt)}</span>
                        <span>{log.userId || 'Staff'}</span>
                      </div>
                      <p className="font-medium text-foreground mt-0.5">{log.fieldDiubah}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        <span className="line-through text-rose-500">{log.nilaiLama}</span> → <span className="text-emerald-600 font-semibold">{log.nilaiBaru}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAuditModalItem(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
