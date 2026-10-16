'use client'

import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react'
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
  AlertTriangle,
  CornerDownRight,
  FileText,
  FileCheck,
  Receipt,
  CreditCard,
  Calendar,
  Image as ImageIcon,
  Eye,
  Camera,
  Upload,
  CheckCircle2,
  Paperclip,
  ExternalLink,
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
import { compressImage, formatFileSize } from '@/lib/imageCompression'

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
  rabTopikId?: string | null
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
  tanggalPekerjaan?: string | Date | null
  fotoUrl?: string | null
  statusBayarItem?: string
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
  totalRealisasiLunasTopik?: number
  totalMenungguBayarTopik?: number
  unpaidCountTopik?: number
  statusPembayaranTopik?: 'LUNAS' | 'MENUNGGU_BAYAR' | 'SEBAGIAN' | 'BELUM_DIBAYAR'
  realisasiLangsung?: RABRealisasiEntry[]
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

const isPdfFile = (url?: string | null): boolean => {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.pdf')
}

export default function RABPlanningModule({ projectId, projectStatus }: RABPlanningProps) {
  const { toast } = useToast()
  const [topiks, setTopiks] = useState<RABTopik[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorOptions, setVendorOptions] = useState<any[]>([])

  // Expanded state (default: all expanded)
  const [expandedTopiks, setExpandedTopiks] = useState<Set<string>>(new Set())

  // Lightbox / Image Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null)

  // New topik form
  const [addTopikOpen, setAddTopikOpen] = useState(false)
  const [newTopikNama, setNewTopikNama] = useState('')
  const [submittingTopik, setSubmittingTopik] = useState(false)

  // Edit topik inline
  const [editTopikId, setEditTopikId] = useState<string | null>(null)
  const [editTopikNama, setEditTopikNama] = useState('')

  // New item form with Date & Compressed Photo
  const [addItemTopikId, setAddItemTopikId] = useState<string | null>(null)
  const [newItemForm, setNewItemForm] = useState({
    namaItem: '',
    satuan: 'unit',
    volumeRencana: '1',
    hargaSatuanRencana: '0',
    tanggalPekerjaan: new Date().toISOString().split('T')[0],
  })
  const [newItemPhotoFile, setNewItemPhotoFile] = useState<File | null>(null)
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState<string | null>(null)
  const [submittingItem, setSubmittingItem] = useState(false)

  // Edit item dialog with Date & Compressed Photo
  const [editItemModal, setEditItemModal] = useState<{ topikId: string; item: RABItem } | null>(null)
  const [editItemForm, setEditItemForm] = useState({
    namaItem: '',
    satuan: '',
    volumeRencana: '',
    hargaSatuanRencana: '',
    tanggalPekerjaan: '',
    fotoUrl: '',
  })
  const [editItemPhotoFile, setEditItemPhotoFile] = useState<File | null>(null)
  const [editItemPhotoPreview, setEditItemPhotoPreview] = useState<string | null>(null)
  const [submittingEditItem, setSubmittingEditItem] = useState(false)

  // Topik Payment Modal (Flexible: bayar per topik atau lunasi semua tagihan topik)
  const [payTopikModal, setPayTopikModal] = useState<RABTopik | null>(null)
  const [payTopikMode, setPayTopikMode] = useState<'BAYAR_TOPIK' | 'LUNASI_SEMUA_REQUEST'>('BAYAR_TOPIK')
  const [payTopikVendorType, setPayTopikVendorType] = useState<'EXISTING' | 'NEW'>('EXISTING')
  const [payTopikForm, setPayTopikForm] = useState({
    jumlah: '0',
    vendorId: '',
    vendorNama: '',
    nomorInvoice: '',
    tanggalBayar: new Date().toISOString().split('T')[0],
    keterangan: '',
    tandaiSemuaItemLunas: true,
  })
  const [payTopikProofFile, setPayTopikProofFile] = useState<File | null>(null)
  const [submittingPayTopik, setSubmittingPayTopik] = useState(false)

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

  const isInitialLoad = useRef(true)

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && isInitialLoad.current) {
        setLoading(true)
      }
      const res = await fetch(`/api/projects/${projectId}/rab-topik`)
      const data = await res.json()
      if (data.success) {
        const fetchedTopiks: RABTopik[] = data.data.topiks || []
        setTopiks(fetchedTopiks)

        if (isInitialLoad.current) {
          // Cek preferensi simpanan di sessionStorage untuk project ini
          let savedSet = new Set<string>()
          try {
            const saved = sessionStorage.getItem(`rab_expanded_${projectId}`)
            if (saved) {
              savedSet = new Set(JSON.parse(saved))
            }
          } catch {}

          if (savedSet.size > 0) {
            setExpandedTopiks(savedSet)
          } else if (fetchedTopiks.length > 0) {
            // Default pertama kali buka: buka semua
            const allSet = new Set(fetchedTopiks.map((t: RABTopik) => t.id))
            setExpandedTopiks(allSet)
            try {
              sessionStorage.setItem(`rab_expanded_${projectId}`, JSON.stringify(Array.from(allSet)))
            } catch {}
          }
          isInitialLoad.current = false
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
      try {
        sessionStorage.setItem(`rab_expanded_${projectId}`, JSON.stringify(Array.from(next)))
      } catch {}
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
        if (data.data?.id) {
          setExpandedTopiks((prev) => {
            const next = new Set(prev)
            next.add(data.data.id)
            try {
              sessionStorage.setItem(`rab_expanded_${projectId}`, JSON.stringify(Array.from(next)))
            } catch {}
            return next
          })
        }
        await fetchData(true)
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
        await fetchData(true)
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
        await fetchData(true)
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
      let fotoUrl = ''
      if (newItemPhotoFile) {
        // Jika file berupa gambar, lakukan kompresi canvas; jika PDF, upload langsung
        let fileToUpload: File | Blob = newItemPhotoFile
        if (newItemPhotoFile.type.startsWith('image/')) {
          fileToUpload = await compressImage(newItemPhotoFile)
        }
        const fd = new FormData()
        fd.append('file', fileToUpload, newItemPhotoFile.name)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) {
          fotoUrl = upData.url
        }
      }

      const res = await fetch(`/api/projects/${projectId}/rab-topik/${topikId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaItem: newItemForm.namaItem,
          satuan: newItemForm.satuan || 'unit',
          volumeRencana: parseFormattedNumber(newItemForm.volumeRencana),
          hargaSatuanRencana: parseFormattedNumber(newItemForm.hargaSatuanRencana),
          tanggalPekerjaan: newItemForm.tanggalPekerjaan,
          fotoUrl: fotoUrl || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Item ditambahkan', description: 'Pekerjaan berhasil dicatat.' })
        setAddItemTopikId(null)
        setNewItemForm({
          namaItem: '',
          satuan: 'unit',
          volumeRencana: '1',
          hargaSatuanRencana: '0',
          tanggalPekerjaan: new Date().toISOString().split('T')[0],
        })
        setNewItemPhotoFile(null)
        setNewItemPhotoPreview(null)
        // Pastikan topik yang baru saja ditambah item tetap terbuka
        setExpandedTopiks((prev) => {
          const next = new Set(prev)
          next.add(topikId)
          try {
            sessionStorage.setItem(`rab_expanded_${projectId}`, JSON.stringify(Array.from(next)))
          } catch {}
          return next
        })
        await fetchData(true)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menambahkan item', variant: 'destructive' })
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleEditItem = async () => {
    if (!editItemModal) return
    setSubmittingEditItem(true)
    try {
      let fotoUrl = editItemForm.fotoUrl || ''
      if (editItemPhotoFile) {
        // Jika file berupa gambar, lakukan kompresi canvas; jika PDF, upload langsung
        let fileToUpload: File | Blob = editItemPhotoFile
        if (editItemPhotoFile.type.startsWith('image/')) {
          fileToUpload = await compressImage(editItemPhotoFile)
        }
        const fd = new FormData()
        fd.append('file', fileToUpload, editItemPhotoFile.name)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) {
          fotoUrl = upData.url
        }
      }

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
            tanggalPekerjaan: editItemForm.tanggalPekerjaan,
            fotoUrl: fotoUrl || null,
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Item diperbarui' })
        const targetTopikId = editItemModal.topikId
        setEditItemModal(null)
        setEditItemPhotoFile(null)
        setEditItemPhotoPreview(null)
        setExpandedTopiks((prev) => {
          const next = new Set(prev)
          next.add(targetTopikId)
          try {
            sessionStorage.setItem(`rab_expanded_${projectId}`, JSON.stringify(Array.from(next)))
          } catch {}
          return next
        })
        await fetchData(true)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal memperbarui item', variant: 'destructive' })
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
        await fetchData(true)
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
        const compressedFile = await compressImage(realisasiInvoiceFile)
        const fd = new FormData()
        fd.append('file', compressedFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) fileBuktiUrl = upData.url
      }

      if (realisasiPayProofFile && realisasiForm.statusBayar === 'sudah_dibayar') {
        const compressedFile = await compressImage(realisasiPayProofFile)
        const fd = new FormData()
        fd.append('file', compressedFile)
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
        await fetchData(true)
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
        const compressedFile = await compressImage(payProofFile)
        const fd = new FormData()
        fd.append('file', compressedFile)
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
        await fetchData(true)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setSubmittingPay(false)
    }
  }

  // ─── Topik Payment Handlers (Fleksibel: Bayar Level Topik) ───
  const openPayTopikModal = (topik: RABTopik) => {
    setPayTopikModal(topik)
    const sisa = Math.max(0, topik.totalRencanaTopik - (topik.totalRealisasiLunasTopik || 0))
    setPayTopikMode((topik.unpaidCountTopik || 0) > 0 ? 'LUNASI_SEMUA_REQUEST' : 'BAYAR_TOPIK')
    setPayTopikVendorType('EXISTING')
    setPayTopikForm({
      jumlah: formatThousandSeparator(String(sisa || topik.totalRencanaTopik || 0)),
      vendorId: '',
      vendorNama: '',
      nomorInvoice: '',
      tanggalBayar: new Date().toISOString().split('T')[0],
      keterangan: (topik.unpaidCountTopik || 0) > 0 ? `Pelunasan tagihan topik: ${topik.nama}` : `Pembayaran total topik: ${topik.nama}`,
      tandaiSemuaItemLunas: true,
    })
    setPayTopikProofFile(null)
  }

  const handleConfirmPayTopik = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payTopikModal) return
    setSubmittingPayTopik(true)
    try {
      let buktiBayarUrl = ''
      if (payTopikProofFile) {
        const compressedFile = await compressImage(payTopikProofFile)
        const fd = new FormData()
        fd.append('file', compressedFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) buktiBayarUrl = upData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab-topik/${payTopikModal.id}/bayar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: payTopikMode,
          jumlah: parseFormattedNumber(payTopikForm.jumlah),
          vendorId: payTopikVendorType === 'EXISTING' ? (payTopikForm.vendorId || null) : null,
          vendorNama: payTopikVendorType === 'NEW' ? payTopikForm.vendorNama : null,
          nomorInvoice: payTopikForm.nomorInvoice || null,
          tanggalBayar: payTopikForm.tanggalBayar,
          tanggalInvoice: payTopikForm.tanggalBayar,
          statusBayar: 'sudah_dibayar',
          buktiBayarUrl: buktiBayarUrl || null,
          keterangan: payTopikForm.keterangan || null,
          tandaiSemuaItemLunas: payTopikForm.tandaiSemuaItemLunas,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Pembayaran Topik Berhasil',
          description: data.message || 'Pembayaran berhasil disimpan.',
        })
        setPayTopikModal(null)
        setPayTopikProofFile(null)
        await fetchData(true)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setSubmittingPayTopik(false)
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
        await fetchData(true)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menghapus transaksi', variant: 'destructive' })
    } finally {
      setDeletingRealisasi(false)
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
              <Card key={topik.id} id={`topik-${topik.id}`} className="overflow-hidden border-2 border-emerald-500/80 dark:border-emerald-600/80 shadow-xs scroll-mt-20">
                {/* Header Topik (Hijau Muda dengan Border Area Hijau) */}
                <CardHeader className="p-3 sm:px-4 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                      onClick={() => toggleTopik(topik.id)}
                    >
                      <button type="button" className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      </button>

                      {editTopikId === topik.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editTopikNama}
                            onChange={(e) => setEditTopikNama(e.target.value)}
                            className="h-7 text-xs w-48 bg-background text-foreground border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditTopik(topik.id)
                              if (e.key === 'Escape') setEditTopikId(null)
                            }}
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300" onClick={() => handleEditTopik(topik.id)}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted" onClick={() => setEditTopikId(null)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100 tracking-tight truncate">
                            {topikIdx + 1}. {topik.nama}
                          </span>
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100/90 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-300/70 dark:border-emerald-700/60">
                            {topik.items.length} item
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ringkasan Angka Topik & Aksi */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground text-[10px] block font-medium">RAB:</span>
                        <span className="font-bold text-foreground">{formatCurrency(topik.totalRencanaTopik)}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground text-[10px] block font-medium">Realisasi:</span>
                        <span className="font-bold text-destructive">
                          {formatCurrency(topik.totalRealisasiTopik)}
                        </span>
                      </div>

                      {/* Status Pembayaran Topik (Badge) */}
                      {(() => {
                        const status = topik.statusPembayaranTopik || 'BELUM_DIBAYAR'
                        if (status === 'LUNAS') {
                          return (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-0.5 gap-1 shadow-xs border border-emerald-700">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Lunas
                            </Badge>
                          )
                        }
                        if (status === 'MENUNGGU_BAYAR') {
                          return (
                            <Badge variant="outline" className="text-amber-900 bg-amber-50 border-amber-300 text-[11px] font-bold px-2.5 py-0.5 gap-1.5 animate-pulse shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-amber-600" />
                              Menunggu Bayar ({formatCurrency(topik.totalMenungguBayarTopik || 0)})
                            </Badge>
                          )
                        }
                        if (status === 'SEBAGIAN') {
                          return (
                            <Badge variant="outline" className="text-blue-900 bg-blue-50 border-blue-300 text-[11px] font-semibold px-2 py-0.5 gap-1 shadow-xs">
                              Sebagian ({formatCurrency(topik.totalRealisasiLunasTopik || 0)})
                            </Badge>
                          )
                        }
                        return (
                          <Badge variant="outline" className="text-slate-600 bg-slate-100 border-slate-300 text-[11px] font-medium px-2 py-0.5">
                            Belum Dibayar
                          </Badge>
                        )
                      })()}

                      {topik.totalRealisasiTopik > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${isOverBudget ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-emerald-300 bg-emerald-100/70 text-emerald-800'}`}
                        >
                          {isOverBudget ? '⚠ Over Budget' : '✓ Budget Aman'}
                        </Badge>
                      )}

                      {!isReadOnly && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-emerald-200 dark:border-emerald-800">
                          {/* Tombol Bayar Topik (Fleksibel: bayar total topik) */}
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                            onClick={() => openPayTopikModal(topik)}
                            title="Bayar total pada topik atau lunasi seluruh tagihan di topik ini"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-white" />
                            Bayar Topik
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 bg-white hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs font-medium dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700"
                            onClick={() => {
                              setAddItemTopikId(topik.id)
                              setNewItemForm({
                                namaItem: '',
                                satuan: 'unit',
                                volumeRencana: '1',
                                hargaSatuanRencana: '0',
                                tanggalPekerjaan: new Date().toISOString().split('T')[0],
                              })
                              setNewItemPhotoFile(null)
                              setNewItemPhotoPreview(null)
                            }}
                          >
                            <Plus className="w-3 h-3 text-emerald-800 dark:text-emerald-300" />
                            Tambah Item
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/50 dark:text-emerald-300 dark:hover:bg-emerald-900"
                            onClick={() => { setEditTopikId(topik.id); setEditTopikNama(topik.nama) }}
                            title="Edit nama topik"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => setDeleteTopikId(topik.id)}
                            title="Hapus topik"
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
                    {/* Riwayat Pembayaran Langsung Topik (jika ada transaksi level topik) */}
                    {topik.realisasiLangsung && topik.realisasiLangsung.length > 0 && (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pembayaran Langsung Level Topik ({topik.realisasiLangsung.length})</span>
                          </div>
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Total: {formatCurrency(topik.realisasiLangsung.reduce((s, r) => s + r.jumlah, 0))}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {topik.realisasiLangsung.map((r) => (
                            <div key={r.id} className="p-2.5 rounded bg-background border border-emerald-200/80 shadow-2xs text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate text-foreground">{r.vendor?.name || r.vendorNama || 'Pembayaran Topik'}</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(r.jumlah)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>📅 {formatDate(r.tanggalBayar || r.tanggalInvoice)}</span>
                                <div className="flex items-center gap-1.5">
                                  {r.buktiBayarUrl && (
                                    <a href={r.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
                                      [Bukti Transfer]
                                    </a>
                                  )}
                                  {r.fileBuktiUrl && (
                                    <a href={r.fileBuktiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                      [Invoice]
                                    </a>
                                  )}
                                </div>
                              </div>
                              {r.keterangan && <p className="text-[10px] text-muted-foreground italic truncate">{r.keterangan}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                              setNewItemForm({
                                namaItem: '',
                                satuan: 'unit',
                                volumeRencana: '1',
                                hargaSatuanRencana: '0',
                                tanggalPekerjaan: new Date().toISOString().split('T')[0],
                              })
                              setNewItemPhotoFile(null)
                              setNewItemPhotoPreview(null)
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
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    {item.fotoUrl ? (
                                      isPdfFile(item.fotoUrl) ? (
                                        <a
                                          href={item.fotoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="shrink-0 flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-md text-[11px] font-semibold hover:bg-rose-100 transition-colors shadow-2xs"
                                          title="Buka lampiran PDF di tab baru"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                                          <span>PDF</span>
                                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewImageModal({ url: item.fotoUrl!, title: item.namaItem })}
                                          className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border shadow-2xs cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                          title="Klik untuk melihat lampiran gambar"
                                        >
                                          <img src={item.fotoUrl} alt={item.namaItem} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Eye className="w-4 h-4 text-white" />
                                          </div>
                                        </button>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 border border-primary/20">
                                        #{itemIdx + 1}
                                      </span>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-foreground truncate">{item.namaItem}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                        {item.tanggalPekerjaan && (
                                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium text-[10px]">
                                            <Calendar className="w-2.5 h-2.5 text-slate-500" />
                                            {formatDate(item.tanggalPekerjaan)}
                                          </span>
                                        )}
                                        <span>Vol: {formatNumber(item.volumeRencana)} {item.satuan} @ {formatCurrency(item.hargaSatuanRencana)}</span>
                                      </div>
                                      {/* Status Pembayaran Item */}
                                      <div className="mt-1.5">
                                        {(() => {
                                          const realisasiList = item.realisasi || []
                                          if (realisasiList.length === 0) {
                                            if (topik.statusPembayaranTopik === 'LUNAS') {
                                              return (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] px-2 py-0.5 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1 inline-flex items-center"
                                                >
                                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                                  Lunas (via Topik)
                                                </Badge>
                                              )
                                            }
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
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs gap-1"
                                        onClick={() => openAddRealisasi(item)}
                                        title="Bayar / catat realisasi pengeluaran item ini"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Realisasi
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-muted-foreground"
                                        onClick={() => {
                                          setEditItemModal({ topikId: topik.id, item })
                                          setEditItemForm({
                                            namaItem: item.namaItem,
                                            satuan: item.satuan,
                                            volumeRencana: String(item.volumeRencana),
                                            hargaSatuanRencana: formatThousandSeparator(String(item.hargaSatuanRencana)),
                                            tanggalPekerjaan: item.tanggalPekerjaan ? new Date(item.tanggalPekerjaan).toISOString().split('T')[0] : '',
                                            fotoUrl: item.fotoUrl || '',
                                          })
                                          setEditItemPhotoFile(null)
                                          setEditItemPhotoPreview(null)
                                        }}
                                        title="Edit item"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
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
                                <TableHead className="min-w-[220px]">Item Pekerjaan</TableHead>
                                <TableHead className="text-right min-w-[120px]">Volume &amp; Satuan</TableHead>
                                <TableHead className="text-right min-w-[120px]">Harga Satuan (RAB)</TableHead>
                                <TableHead className="text-right min-w-[130px]">Total Rencana (RAB)</TableHead>
                                <TableHead className="text-right min-w-[120px]">Total Realisasi</TableHead>
                                <TableHead className="text-center min-w-[170px]">Status Pembayaran</TableHead>
                                <TableHead className="text-right min-w-[120px]">Selisih / Sisa</TableHead>
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
                                        <div className="flex items-start gap-2.5">
                                          {item.fotoUrl ? (
                                            isPdfFile(item.fotoUrl) ? (
                                              <a
                                                href={item.fotoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 rounded-md text-xs font-semibold shadow-2xs transition-all"
                                                title="Buka dokumen lampiran PDF"
                                              >
                                                <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                <span>PDF</span>
                                                <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                                              </a>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => setPreviewImageModal({ url: item.fotoUrl!, title: item.namaItem })}
                                                className="relative group shrink-0 w-11 h-11 rounded-md overflow-hidden border border-border/80 shadow-2xs hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                                                title="Klik untuk melihat lampiran gambar"
                                              >
                                                <img
                                                  src={item.fotoUrl}
                                                  alt={item.namaItem}
                                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                  <Eye className="w-3.5 h-3.5 text-white" />
                                                </div>
                                              </button>
                                            )
                                          ) : null}
                                          <div className="min-w-0">
                                            <div className="font-semibold text-foreground text-sm">{item.namaItem}</div>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                              {item.tanggalPekerjaan && (
                                                <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium text-[10px]">
                                                  <Calendar className="w-3 h-3 text-slate-500" />
                                                  {formatDate(item.tanggalPekerjaan)}
                                                </span>
                                              )}
                                              <span>Topik: {topik.nama}</span>
                                            </div>
                                          </div>
                                        </div>
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
                                            if (topik.statusPembayaranTopik === 'LUNAS') {
                                              return (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs px-2.5 py-1 font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 gap-1.5 inline-flex items-center"
                                                >
                                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                  Lunas (via Topik)
                                                </Badge>
                                              )
                                            }
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
                                                    tanggalPekerjaan: item.tanggalPekerjaan ? new Date(item.tanggalPekerjaan).toISOString().split('T')[0] : '',
                                                    fotoUrl: item.fotoUrl || '',
                                                  })
                                                  setEditItemPhotoFile(null)
                                                  setEditItemPhotoPreview(null)
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
            <DialogDescription className="sr-only">Tambah Topik RAB</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Nama Topik *</Label>
              <Input
                value={newTopikNama}
                onChange={(e) => setNewTopikNama(e.target.value)}
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Item Pekerjaan</DialogTitle>
            <DialogDescription className="sr-only">Tambah Item Pekerjaan</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Nama Item / Uraian Pekerjaan *</Label>
              <Input
                value={newItemForm.namaItem}
                onChange={(e) => setNewItemForm({ ...newItemForm, namaItem: e.target.value })}
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            {/* Tanggal Pekerjaan */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Tanggal Pekerjaan *
              </Label>
              <Input
                type="date"
                value={newItemForm.tanggalPekerjaan}
                onChange={(e) => setNewItemForm({ ...newItemForm, tanggalPekerjaan: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Satuan *</Label>
                <Input
                  value={newItemForm.satuan}
                  onChange={(e) => setNewItemForm({ ...newItemForm, satuan: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Volume Target *</Label>
                <Input
                  value={newItemForm.volumeRencana}
                  onChange={(e) => setNewItemForm({ ...newItemForm, volumeRencana: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Harga Satuan Rencana (Rp) *</Label>
              <Input
                value={newItemForm.hargaSatuanRencana}
                onChange={(e) => setNewItemForm({ ...newItemForm, hargaSatuanRencana: formatThousandSeparator(e.target.value) })}
                className="h-9 text-xs font-semibold"
              />
            </div>

            {/* Upload Lampiran (Opsional - Gambar atau PDF) */}
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  Lampiran (Opsional)
                </Label>
                <span className="text-[10px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                  Gambar / PDF
                </span>
              </div>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="h-9 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setNewItemPhotoFile(file)
                  if (file && file.type.startsWith('image/')) {
                    const previewUrl = URL.createObjectURL(file)
                    setNewItemPhotoPreview(previewUrl)
                  } else {
                    setNewItemPhotoPreview(null)
                  }
                }}
              />
              {newItemPhotoFile && (
                <div className="mt-1.5">
                  {newItemPhotoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={newItemPhotoPreview}
                        alt="Preview lampiran gambar"
                        className="w-20 h-20 object-cover rounded-md border border-border shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemPhotoFile(null)
                          setNewItemPhotoPreview(null)
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-destructive/90"
                        title="Hapus file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        Foto otomatis dikompresi ({formatFileSize(newItemPhotoFile.size)})
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-lg text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{newItemPhotoFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatFileSize(newItemPhotoFile.size)} • Dokumen PDF</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemPhotoFile(null)
                          setNewItemPhotoPreview(null)
                        }}
                        className="p-1 hover:bg-muted rounded text-destructive"
                        title="Hapus file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item Pekerjaan</DialogTitle>
            <DialogDescription className="sr-only">Edit Item Pekerjaan</DialogDescription>
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

            {/* Tanggal Pekerjaan */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Tanggal Pekerjaan
              </Label>
              <Input
                type="date"
                value={editItemForm.tanggalPekerjaan}
                onChange={(e) => setEditItemForm({ ...editItemForm, tanggalPekerjaan: e.target.value })}
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

            {/* Lampiran di Edit Item */}
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  Lampiran (Opsional)
                </Label>
                <span className="text-[10px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                  Gambar / PDF
                </span>
              </div>

              {/* Tampilkan lampiran lama jika tersimpan dan belum diganti */}
              {editItemForm.fotoUrl && !editItemPhotoFile && (
                <div className="mb-2">
                  {isPdfFile(editItemForm.fotoUrl) ? (
                    <div className="flex items-center justify-between p-2.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <a
                          href={editItemForm.fotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-rose-700 dark:text-rose-300 hover:underline truncate inline-flex items-center gap-1"
                        >
                          Lampiran Dokumen PDF Tersimpan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditItemForm({ ...editItemForm, fotoUrl: '' })}
                        className="text-xs text-destructive hover:underline font-medium shrink-0 ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={editItemForm.fotoUrl}
                        alt="Lampiran saat ini"
                        className="w-20 h-20 object-cover rounded-md border border-border shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setEditItemForm({ ...editItemForm, fotoUrl: '' })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-destructive/90"
                        title="Hapus lampiran ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Lampiran tersimpan</span>
                    </div>
                  )}
                </div>
              )}

              <Input
                type="file"
                accept="image/*,application/pdf"
                className="h-9 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setEditItemPhotoFile(file)
                  if (file && file.type.startsWith('image/')) {
                    const previewUrl = URL.createObjectURL(file)
                    setEditItemPhotoPreview(previewUrl)
                  } else {
                    setEditItemPhotoPreview(null)
                  }
                }}
              />

              {editItemPhotoFile && (
                <div className="mt-1.5">
                  {editItemPhotoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={editItemPhotoPreview}
                        alt="Preview lampiran baru"
                        className="w-20 h-20 object-cover rounded-md border border-border shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditItemPhotoFile(null)
                          setEditItemPhotoPreview(null)
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-destructive/90"
                        title="Batal ganti lampiran"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        Foto baru dikompresi: {editItemPhotoFile.name} ({formatFileSize(editItemPhotoFile.size)})
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-lg text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{editItemPhotoFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatFileSize(editItemPhotoFile.size)} • File PDF Baru</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditItemPhotoFile(null)
                          setEditItemPhotoPreview(null)
                        }}
                        className="p-1 hover:bg-muted rounded text-destructive"
                        title="Batal pilih file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
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

      {/* ─── DIALOG: Pembayaran Fleksibel Level Topik ─── */}
      <Dialog open={!!payTopikModal} onOpenChange={(open) => { if (!open) setPayTopikModal(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Pembayaran Topik: {payTopikModal?.nama}
            </DialogTitle>
            <DialogDescription>
              Pembayaran fleksibel: Anda dapat melunasi seluruh request item atau mencatat pembayaran langsung untuk topik ini.
            </DialogDescription>
          </DialogHeader>

          {payTopikModal && (
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border border-border/60">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-muted-foreground text-[10px] block">RAB Rencana:</span>
                  <span className="font-bold text-foreground text-sm">{formatCurrency(payTopikModal.totalRencanaTopik)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Sudah Dibayar (Lunas):</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(payTopikModal.totalRealisasiLunasTopik || 0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Sisa Belum Lunas:</span>
                  <span className="font-bold text-rose-600 text-sm">
                    {formatCurrency(Math.max(0, payTopikModal.totalRencanaTopik - (payTopikModal.totalRealisasiLunasTopik || 0)))}
                  </span>
                </div>
              </div>

              {(payTopikModal.unpaidCountTopik || 0) > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Ada {payTopikModal.unpaidCountTopik} request menunggu bayar ({formatCurrency(payTopikModal.totalMenungguBayarTopik || 0)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode Pilihan Pembayaran */}
          <div className="flex border-b border-border text-xs">
            <button
              type="button"
              onClick={() => setPayTopikMode('BAYAR_TOPIK')}
              className={`py-2 px-3 border-b-2 font-medium transition-colors ${payTopikMode === 'BAYAR_TOPIK' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Bayar / Catat Pengeluaran Topik
            </button>
            {(payTopikModal?.unpaidCountTopik || 0) > 0 && (
              <button
                type="button"
                onClick={() => setPayTopikMode('LUNASI_SEMUA_REQUEST')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${payTopikMode === 'LUNASI_SEMUA_REQUEST' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Lunasi Semua Request Menunggu ({payTopikModal?.unpaidCountTopik})
              </button>
            )}
          </div>

          <form onSubmit={handleConfirmPayTopik} className="space-y-3 pt-1">
            {payTopikMode === 'BAYAR_TOPIK' ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Vendor / Toko / Penerima Dana</Label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPayTopikVendorType('EXISTING')}
                        className={`hover:underline ${payTopikVendorType === 'EXISTING' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                      >
                        Pilih Database
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setPayTopikVendorType('NEW')}
                        className={`hover:underline ${payTopikVendorType === 'NEW' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                      >
                        Input Bebas
                      </button>
                    </div>
                  </div>

                  {payTopikVendorType === 'EXISTING' ? (
                    <Select
                      value={payTopikForm.vendorId}
                      onValueChange={(val) => setPayTopikForm((prev) => ({ ...prev, vendorId: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
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
                      value={payTopikForm.vendorNama}
                      onChange={(e) => setPayTopikForm((prev) => ({ ...prev, vendorNama: e.target.value }))}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Nominal Pembayaran (Rp) *</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        className="pl-8 h-9 text-xs font-bold"
                        value={payTopikForm.jumlah}
                        onChange={(e) => setPayTopikForm((prev) => ({ ...prev, jumlah: formatThousandSeparator(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tanggal Pembayaran *</Label>
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={payTopikForm.tanggalBayar}
                      onChange={(e) => setPayTopikForm((prev) => ({ ...prev, tanggalBayar: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nomor Invoice / Kuitansi (Opsional)</Label>
                  <Input
                    className="h-9 text-xs"
                    value={payTopikForm.nomorInvoice}
                    onChange={(e) => setPayTopikForm((prev) => ({ ...prev, nomorInvoice: e.target.value }))}
                  />
                </div>

                {/* Checkbox tandai request lunas */}
                {(payTopikModal?.unpaidCountTopik || 0) > 0 && (
                  <label className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payTopikForm.tandaiSemuaItemLunas}
                      onChange={(e) => setPayTopikForm((prev) => ({ ...prev, tandaiSemuaItemLunas: e.target.checked }))}
                      className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tandai juga {payTopikModal?.unpaidCountTopik} request menunggu bayar di topik ini sebagai Lunas</span>
                  </label>
                )}
              </>
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-emerald-900">
                  Konfirmasi Pelunasan Sekaligus untuk Seluruh Request:
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Semua transaksi berstatus ⏳ Menunggu Bayar ({payTopikModal?.unpaidCountTopik} tagihan, total: {formatCurrency(payTopikModal?.totalMenungguBayarTopik || 0)}) akan otomatis diperbarui menjadi ✓ Sudah Dibayar (Lunas).
                </p>
                <div className="space-y-1 pt-1">
                  <Label className="text-xs">Tanggal Pelunasan *</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs bg-background"
                    value={payTopikForm.tanggalBayar}
                    onChange={(e) => setPayTopikForm((prev) => ({ ...prev, tanggalBayar: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs flex items-center justify-between">
                <span>Upload Bukti Transfer / Resi Pelunasan (Opsional)</span>
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  Otomatis Dikompresi
                </span>
              </Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="h-8 text-xs"
                onChange={(e) => setPayTopikProofFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Catatan Pembayaran</Label>
              <Input
                className="h-9 text-xs"
                value={payTopikForm.keterangan}
                onChange={(e) => setPayTopikForm((prev) => ({ ...prev, keterangan: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayTopikModal(null)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submittingPayTopik} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {submittingPayTopik ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {payTopikMode === 'LUNASI_SEMUA_REQUEST' ? 'Lunasi Semua Tagihan Topik' : 'Simpan Pembayaran Topik'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Lightbox Preview Lampiran Pekerjaan ─── */}
      <Dialog open={!!previewImageModal} onOpenChange={(open) => { if (!open) setPreviewImageModal(null) }}>
        <DialogContent className="sm:max-w-2xl p-4">
          <DialogHeader className="pb-2 border-b border-border/60">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              {isPdfFile(previewImageModal?.url) ? (
                <FileText className="w-4 h-4 text-rose-600" />
              ) : (
                <ImageIcon className="w-4 h-4 text-primary" />
              )}
              {previewImageModal?.title || 'Lampiran Pekerjaan'}
            </DialogTitle>
            <DialogDescription className="sr-only">Pratinjau lampiran pekerjaan</DialogDescription>
          </DialogHeader>
          {previewImageModal && (
            <div className="py-2 flex flex-col items-center justify-center">
              {isPdfFile(previewImageModal.url) ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 w-full bg-muted/20 rounded-lg border border-border">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-foreground">{previewImageModal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dokumen lampiran pekerjaan format PDF</p>
                  </div>
                  <a
                    href={previewImageModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Dokumen PDF di Tab Baru
                  </a>
                </div>
              ) : (
                <>
                  <div className="max-h-[70vh] w-full flex items-center justify-center overflow-hidden rounded-lg bg-black/5 dark:bg-white/5 border border-border">
                    <img
                      src={previewImageModal.url}
                      alt={previewImageModal.title}
                      className="max-h-[70vh] max-w-full object-contain rounded-md"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full mt-3 text-xs">
                    <span className="text-muted-foreground text-[11px] truncate max-w-xs">{previewImageModal.title}</span>
                    <a
                      href={previewImageModal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Buka Gambar Asli di Tab Baru
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="pt-1">
            <Button variant="outline" size="sm" onClick={() => setPreviewImageModal(null)}>
              Tutup
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
                    <SelectValue />
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
    </div>
  )
}
