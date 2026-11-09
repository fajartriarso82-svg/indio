'use client'

import React, { useState, useEffect, useCallback, Fragment } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Package,
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  MessageSquare,
  Calculator,
  Badge as BadgeIcon,
  Edit,
  Download,
  TrendingUp,
  TrendingDown,
  Archive,
  CornerDownRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  FileCheck,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  SuratJalanForm,
  BASTForm,
  InvoiceForm,
  KuitansiForm,
} from './DocumentFormDialogs'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import ProjectForm from './ProjectForm'

const RABPlanningModule = dynamic(() => import('./rab/RABPlanningModule'), { ssr: false })
const RABSummaryCard = dynamic(() => import('./rab/RABSummaryCard'), { ssr: false })

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]',
  COMPLETED: 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
  CANCELLED: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID').format(value)

const formatDate = (d: string | null | Date) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Parsing string dengan pemisah ribuan (titik) atau desimal (koma) ke float number murni
const parseFormattedNumber = (val: string | number): number => {
  if (typeof val === 'number') return val
  if (!val) return 0
  const clean = String(val).replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

// Memformat string input otomatis dengan pemisah ribuan (titik) khas Indonesia
const formatThousandSeparator = (val: string): string => {
  if (!val) return ''
  const clean = val.replace(/[^0-9,]/g, '')
  const parts = clean.split(',')
  const integerPart = parts[0] ? parseInt(parts[0], 10).toLocaleString('id-ID') : ''
  return parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart
}

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  // RAB Purchase dialog
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [vendorType, setVendorType] = useState<'EXISTING' | 'NEW'>('EXISTING')
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '',
    vendorName: '',
    qty: '1',
    buyPrice: '',
    notes: '',
    requestDate: new Date().toISOString().split('T')[0],
  })
  const [purchaseDocFile, setPurchaseDocFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [submittingPurchase, setSubmittingPurchase] = useState(false)

  // RAB Pay dialog
  const [payOpen, setPayOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payProofFile, setPayProofFile] = useState<File | null>(null)
  const [submittingPay, setSubmittingPay] = useState(false)

  // Additional cost dialog
  const [addCostOpen, setAddCostOpen] = useState(false)
  const [addCostForm, setAddCostForm] = useState({
    category: 'ACCESSORIES',
    description: '',
    amount: '0',
    vendorName: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [addCostFile, setAddCostFile] = useState<File | null>(null)
  const [submittingCost, setSubmittingCost] = useState(false)

  // Progress note
  const [noteContent, setNoteContent] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Document dialogs
  const [sjFormOpen, setSjFormOpen] = useState(false)
  const [bastFormOpen, setBastFormOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [kuitansiFormOpen, setKuitansiFormOpen] = useState(false)

  // Client payment state
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    type: 'LUNAS',
    terminNo: '1',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'TRANSFER',
    invoiceNumber: '',
    notes: '',
  })
  const [paymentInvoiceFile, setPaymentInvoiceFile] = useState<File | null>(null)
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null)
  const [deletingPayment, setDeletingPayment] = useState(false)

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  // Delete & Archive
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)

  // Edit Project Modal
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false)

  // Pengadaan Item Management
  const [editItemModal, setEditItemModal] = useState<any | null>(null)
  const [editItemForm, setEditItemForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    qty: '1',
    unit: 'pcs',
    unitPrice: '0',
    deadline: '',
  })
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [addItemForm, setAddItemForm] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    qty: '1',
    unit: 'pcs',
    unitPrice: '0',
    deadline: '',
  })
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<any | null>(null)
  const [submittingItemAction, setSubmittingItemAction] = useState(false)

  const openEditItemModal = (item: any) => {
    setEditItemModal(item)
    setEditItemForm({
      itemId: item.itemId || '',
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      qty: formatThousandSeparator(String(item.qty ?? 1)),
      unit: item.unit || 'pcs',
      unitPrice: formatThousandSeparator(String(item.unitPrice ?? 0)),
      deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
    })
  }

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItemModal) return
    if (!editItemForm.itemName.trim()) {
      toast({ title: 'Validasi', description: 'Nama item wajib diisi', variant: 'destructive' })
      return
    }
    setSubmittingItemAction(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItemModal.id,
          itemId: editItemForm.itemId,
          itemCode: editItemForm.itemCode,
          itemName: editItemForm.itemName,
          qty: parseFormattedNumber(editItemForm.qty),
          unit: editItemForm.unit,
          unitPrice: parseFormattedNumber(editItemForm.unitPrice),
          deadline: editItemForm.deadline ? new Date(editItemForm.deadline).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Item berhasil diperbarui' })
        setEditItemModal(null)
        await fetchProject()
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal memperbarui item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal memperbarui item', variant: 'destructive' })
    } finally {
      setSubmittingItemAction(false)
    }
  }

  const handleSaveAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addItemForm.itemName.trim()) {
      toast({ title: 'Validasi', description: 'Nama item wajib diisi', variant: 'destructive' })
      return
    }
    setSubmittingItemAction(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: addItemForm.itemId,
          itemCode: addItemForm.itemCode,
          itemName: addItemForm.itemName,
          qty: parseFormattedNumber(addItemForm.qty),
          unit: addItemForm.unit,
          unitPrice: parseFormattedNumber(addItemForm.unitPrice),
          deadline: addItemForm.deadline ? new Date(addItemForm.deadline).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Item baru berhasil ditambahkan' })
        setAddItemModalOpen(false)
        setAddItemForm({
          itemId: '',
          itemCode: '',
          itemName: '',
          qty: '1',
          unit: 'pcs',
          unitPrice: '0',
          deadline: '',
        })
        await fetchProject()
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal menambahkan item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menambahkan item', variant: 'destructive' })
    } finally {
      setSubmittingItemAction(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemConfirm) return
    setSubmittingItemAction(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/items?itemId=${deleteItemConfirm.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Item berhasil dihapus' })
        setDeleteItemConfirm(null)
        await fetchProject()
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal menghapus item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menghapus item', variant: 'destructive' })
    } finally {
      setSubmittingItemAction(false)
    }
  }

  const handleDownloadZip = () => {
    setDownloadingZip(true)
    toast({
      title: 'Menyiapkan Arsip ZIP',
      description: 'Sedang mengompres seluruh file proyek (PO, RAB, Invoice, Surat Jalan, dll)...',
    })
    const link = document.createElement('a')
    link.href = `/api/projects/${projectId}/export-archive`
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloadingZip(false), 2500)
  }

  const handleDeleteProject = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Proyek Berhasil Dihapus',
          description: data.message || 'Proyek dan semua file terkait di Supabase Storage telah dibersihkan.',
        })
        onBack()
      } else {
        toast({
          title: 'Gagal Menghapus Proyek',
          description: data.error || 'Terjadi kesalahan saat menghapus proyek',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success) setProject(data.data)
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat proyek', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  useEffect(() => {
    if (activeTab === 'info') {
      fetchProject()
    }
  }, [activeTab, fetchProject])

  useEffect(() => {
    if (purchaseOpen || addCostOpen) {
      fetch('/api/vendors')
        .then((r) => r.json())
        .then((data) => { if (data.success) setVendors(data.data) })
        .catch(() => {})
    }
  }, [purchaseOpen, addCostOpen])

  const openAddPurchase = (item: any) => {
    setSelectedItemId(item.id)
    const itemBuyQty = item.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
    const remQty = Math.max(0, item.qty - itemBuyQty)
    setPurchaseForm({
      vendorId: '',
      vendorName: '',
      qty: remQty > 0 ? formatNumber(remQty) : '1',
      buyPrice: '',
      notes: '',
      requestDate: new Date().toISOString().split('T')[0],
    })
    setVendorType('EXISTING')
    setPurchaseDocFile(null)
    setPurchaseOpen(true)
  }

  const openPay = (p: any) => {
    setSelectedPurchaseId(p.id)
    setSelectedPurchase(p)
    setPayDate(new Date().toISOString().split('T')[0])
    setPayProofFile(null)
    setPayOpen(true)
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (vendorType === 'NEW' && !purchaseForm.vendorName.trim()) {
      toast({ title: 'Error', description: 'Nama vendor baru wajib diisi', variant: 'destructive' })
      return
    }
    if (vendorType === 'EXISTING' && !purchaseForm.vendorId) {
      toast({ title: 'Error', description: 'Pilih vendor dari daftar', variant: 'destructive' })
      return
    }

    const qtyNum = parseFormattedNumber(purchaseForm.qty)
    const buyPriceNum = parseFormattedNumber(purchaseForm.buyPrice)

    if (qtyNum <= 0) {
      toast({ title: 'Error', description: 'Jumlah (Qty) harus lebih dari 0', variant: 'destructive' })
      return
    }

    setSubmittingPurchase(true)
    try {
      let docUrl = ''
      if (purchaseDocFile) {
        const formData = new FormData()
        formData.append('file', purchaseDocFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) docUrl = uploadData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectItemId: selectedItemId,
          vendorId: vendorType === 'EXISTING' ? purchaseForm.vendorId : null,
          vendorName: vendorType === 'NEW' ? purchaseForm.vendorName : undefined,
          qty: qtyNum,
          buyPrice: buyPriceNum,
          requestDate: purchaseForm.requestDate || new Date().toISOString().split('T')[0],
          docUrl,
          notes: purchaseForm.notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembelian Ditambahkan', description: 'Request pembelian RAB telah dicatat.' })
        setPurchaseOpen(false)
        setVendorType('EXISTING')
        setPurchaseForm({
          vendorId: '',
          vendorName: '',
          qty: '1',
          buyPrice: '',
          notes: '',
          requestDate: new Date().toISOString().split('T')[0],
        })
        setPurchaseDocFile(null)
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingPurchase(false)
    }
  }

  const handlePayPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPay(true)
    try {
      let paymentProofUrl = ''
      if (payProofFile) {
        const formData = new FormData()
        formData.append('file', payProofFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) paymentProofUrl = uploadData.url
      }

      const res = await fetch(`/api/projects/${projectId}/rab/${selectedPurchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SUCCESS',
          paymentDate: payDate || new Date().toISOString().split('T')[0],
          paymentProofUrl: paymentProofUrl || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembayaran Dikonfirmasi', description: 'Status pembelian telah diperbarui menjadi Lunas.' })
        setPayOpen(false)
        setPayProofFile(null)
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingPay(false)
    }
  }

  const handleUploadSjReturn = async (sjId: string, file: File) => {
    try {
      toast({ title: 'Mengupload...', description: 'Mohon tunggu.' })
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (uploadData.success) {
        const updateRes = await fetch(`/api/projects/${projectId}/surat-jalan/${sjId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ returnedFileUrl: uploadData.url })
        })
        const updateData = await updateRes.json()
        if (updateData.success) {
          toast({ title: 'Upload Berhasil', description: 'Dokumen SJ kembali telah disimpan.' })
          fetchProject()
        } else {
          toast({ title: 'Error', description: 'Gagal menyimpan URL dokumen', variant: 'destructive' })
        }
      } else {
        toast({ title: 'Error', description: 'Gagal mengupload file', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Terjadi kesalahan jaringan', variant: 'destructive' })
    }
  }

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCost(true)
    try {
      let docUrl = ''
      if (addCostFile) {
        const formData = new FormData()
        formData.append('file', addCostFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) docUrl = uploadData.url
      }

      const res = await fetch(`/api/projects/${projectId}/additional-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: addCostForm.category,
          description: addCostForm.description,
          amount: parseFormattedNumber(addCostForm.amount),
          vendorName: addCostForm.vendorName || null,
          date: addCostForm.date,
          docUrl: docUrl || null,
          notes: addCostForm.notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Biaya Ditambahkan', description: 'Biaya tambahan telah dicatat.' })
        setAddCostOpen(false)
        setAddCostForm({ category: 'ACCESSORIES', description: '', amount: '0', vendorName: '', notes: '', date: new Date().toISOString().split('T')[0] })
        setAddCostFile(null)
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingCost(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setSubmittingNote(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Catatan Ditambahkan' })
        setNoteContent('')
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Status Diperbarui', description: `Status proyek diubah ke ${newStatus}` })
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setStatusUpdating(false)
    }
  }

  const openRecordPayment = () => {
    const poTot = project?.items?.reduce((s: number, i: any) => s + i.total, 0) || project?.contractValue || 0
    const totalPaid = project?.payments?.reduce((s: number, p: any) => s + (p.amount || 0), 0) || 0
    const remaining = Math.max(0, poTot - totalPaid)
    const nextTermin = (project?.payments?.length || 0) + 1

    setPaymentForm({
      type: totalPaid === 0 && remaining > 0 ? 'LUNAS' : 'TERMIN',
      terminNo: String(nextTermin),
      title: totalPaid === 0 ? 'Pelunasan 100% Pesanan' : `Termin ${nextTermin}`,
      amount: formatNumber(remaining > 0 ? remaining : 0),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'TRANSFER',
      invoiceNumber: project?.poNumber ? `INV-${project.projectCode}` : '',
      notes: '',
    })
    setPaymentInvoiceFile(null)
    setPaymentProofFile(null)
    setPaymentOpen(true)
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFormattedNumber(paymentForm.amount)
    if (numAmount <= 0) {
      toast({ title: 'Validasi Gagal', description: 'Nominal pembayaran harus lebih dari 0', variant: 'destructive' })
      return
    }

    setSubmittingPayment(true)
    try {
      let invoiceUrl = ''
      let proofUrl = ''

      if (paymentInvoiceFile) {
        const fd = new FormData()
        fd.append('file', paymentInvoiceFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) invoiceUrl = upData.url
      }

      if (paymentProofFile) {
        const fd = new FormData()
        fd.append('file', paymentProofFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (upData.success) proofUrl = upData.url
      }

      const res = await fetch(`/api/projects/${projectId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: paymentForm.type,
          terminNo: paymentForm.type === 'TERMIN' ? parseInt(paymentForm.terminNo) || 1 : null,
          title: paymentForm.title.trim() || (paymentForm.type === 'TERMIN' ? `Termin ${paymentForm.terminNo || 1}` : 'Pembayaran Pelunasan'),
          amount: numAmount,
          date: paymentForm.date,
          paymentMethod: paymentForm.paymentMethod,
          invoiceNumber: paymentForm.invoiceNumber || null,
          invoiceUrl: invoiceUrl || null,
          proofUrl: proofUrl || null,
          notes: paymentForm.notes || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembayaran Berhasil Dicatat', description: 'Pembayaran dari klien telah disimpan.' })
        setPaymentOpen(false)
        setPaymentInvoiceFile(null)
        setPaymentProofFile(null)
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    setDeletingPayment(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/payments/${paymentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Dihapus', description: 'Catatan pembayaran klien telah dihapus.' })
        setDeletePaymentId(null)
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      setDeletingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Proyek tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Kembali</Button>
      </div>
    )
  }

  // Calculate Laba/Rugi & Client Payment
  const isPengadaan = (project.type || '').toUpperCase() === 'PENGADAAN'

  // Total Nilai Kontrak / Penjualan Proyek (contractValue / items / rencana RAB)
  const totalRabRencana = (project.rabTopiks || []).reduce(
    (s: number, t: any) =>
      s +
      (t.items?.reduce(
        (si: number, item: any) =>
          si + ((Number(item.volumeRencana) || 0) * (Number(item.hargaSatuanRencana) || 0)),
        0
      ) || 0),
    0
  )
  const poTotal =
    (project.items?.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0) ||
    project.contractValue ||
    totalRabRencana ||
    0

  // Realisasi RAB (Topik, Item, & Biaya Tambahan)
  const rabRealisasiList = (project.rabRealisasi || []) as any[]
  const totalRabRealisasi = rabRealisasiList.reduce((s: number, r: any) => s + (Number(r.jumlah) || 0), 0)
  const totalRabLunas = rabRealisasiList
    .filter((r: any) => r.statusBayar === 'sudah_dibayar')
    .reduce((s: number, r: any) => s + (Number(r.jumlah) || 0), 0)
  const totalRabMenunggu = rabRealisasiList
    .filter((r: any) => r.statusBayar !== 'sudah_dibayar')
    .reduce((s: number, r: any) => s + (Number(r.jumlah) || 0), 0)

  // Pengeluaran pengadaan & additional legacy
  const totalPurchases =
    project.items?.reduce(
      (s: number, i: any) =>
        s + (i.purchases?.reduce((ps: number, p: any) => ps + (Number(p.totalBuy) || 0), 0) || 0),
      0
    ) || 0
  const totalRabPurchases =
    project.rabPurchases?.reduce((s: number, p: any) => s + (Number(p.totalBuy) || 0), 0) || 0
  const totalAddCosts =
    project.additionalCosts?.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0) || 0

  // Total Pengeluaran gabungan (Pengadaan + Biaya Tambahan + RAB Realisasi)
  const totalCost = totalPurchases + totalRabPurchases + totalAddCosts + totalRabRealisasi
  const totalCashPaid = totalPurchases + totalRabPurchases + totalAddCosts + totalRabLunas
  const profit = poTotal - totalCost

  const clientPayments = (project.payments || []) as any[]
  const totalPaidByClient = clientPayments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
  const remainingClientBill = Math.max(0, poTotal - totalPaidByClient)
  const paymentPercent = poTotal > 0 ? Math.min(100, Math.round((totalPaidByClient / poTotal) * 100)) : 0
  const realizedCashProfit = totalPaidByClient - totalCashPaid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <Badge variant="outline" className="text-[10px]">{project.projectCode}</Badge>
            <Badge variant="outline" className="text-[10px]">{project.type}</Badge>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColors[project.status] || ''}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Klien: {project.client?.name || '—'} · PO: {project.poNumber || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Proyek */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditProjectModalOpen(true)}
            className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
            title="Edit Informasi Proyek & Item RAB Pengadaan"
          >
            <Edit className="w-4 h-4" />
            Edit Proyek
          </Button>

          {/* Download Arsip .ZIP */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            title="Download semua file proyek (PO, RAB, Invoice, Surat Jalan, dll) terkompresi .zip"
          >
            {downloadingZip ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Archive className="w-4 h-4 mr-1.5" />
            )}
            Download Arsip (.zip)
          </Button>

          {project.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={statusUpdating}>
              Mulai Proyek
            </Button>
          )}
          {project.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => setCompleteOpen(true)} disabled={statusUpdating}>
              Selesai
            </Button>
          )}

          {/* Hapus Proyek */}
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
            title="Hapus proyek dan seluruh file terkait di bucket Supabase"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Hapus Proyek
          </Button>
        </div>
      </div>

      {/* Confirm: Hapus Proyek */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Hapus Proyek & File Terkait
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2.5 text-sm text-foreground/80">
                <div>
                  Apakah Anda yakin ingin menghapus proyek <strong>{project.name}</strong> ({project.projectCode})?
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                  <div className="font-bold text-rose-900">⚠️ PEMBERSIHAN DATA & BUCKET STORAGE:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Semua file proyek di Supabase Storage (PO, Invoice, RAB, Surat Jalan, bukti transfer, dll) akan <strong>dihapus permanen dari bucket</strong>.</li>
                    <li>Semua item, realisasi RAB, invoice, dan dokumen proyek akan dihapus dari database.</li>
                    <li>Tindakan ini <strong>tidak dapat dibatalkan</strong>.</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                await handleDeleteProject()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Menghapus & Membersihkan Bucket...</>
              ) : (
                'Hapus Proyek & File'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: Selesaikan Proyek */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan Proyek</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menandai proyek <strong>{project.name}</strong>
              {project.projectCode ? ` (${project.projectCode})` : ''} sebagai <strong>selesai</strong>?
              Setelah selesai, item RAB tidak dapat ditambah atau diproses lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                await handleStatusUpdate('COMPLETED')
                setCompleteOpen(false)
              }}
              disabled={statusUpdating}
            >
              {statusUpdating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Menyelesaikan...</>
              ) : (
                'Ya, Selesaikan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info"><FileText className="w-3.5 h-3.5" />Info</TabsTrigger>
          <TabsTrigger value="rab"><Calculator className="w-3.5 h-3.5" />RAB</TabsTrigger>
          <TabsTrigger value="documents"><ClipboardList className="w-3.5 h-3.5" />Dokumen</TabsTrigger>
        </TabsList>

        {/* ─── TAB: INFO ─── */}
        <TabsContent value="info" className="mt-4">
          <div className="bg-card border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Informasi & Ringkasan Proyek</h3>
                  <p className="text-xs text-muted-foreground">Detail kontrak, progres pembayaran klien, dan catatan pekerjaan</p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold px-3 shadow-xs shrink-0 self-start sm:self-auto"
                onClick={openRecordPayment}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Catat Pembayaran
              </Button>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium block">Klien</span>
                <p className="font-semibold text-foreground text-sm truncate">{project.client?.name || '—'}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  PIC: {project.clientPicName || '—'}{project.clientPicPhone ? ` (${project.clientPicPhone})` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium block">Nomor PO & Berkas</span>
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                  {project.poNumber || '—'}
                  {project.poFileUrl && (
                    <a
                      href={project.poFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      [Lihat File]
                    </a>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  PIC Internal: {project.internalPic || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium block">Periode Pengerjaan</span>
                <p className="font-semibold text-foreground text-sm">
                  {formatDate(project.startDate)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  s/d {formatDate(project.endDate)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium block">Nilai Kontrak / PO</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {formatCurrency(poTotal)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {project.ppnFromClient ? 'Termasuk PPN Klien' : 'Non-PPN'} · Tipe: {project.type}
                </p>
              </div>

              {(project.clientAddress || project.notes) && (
                <div className="col-span-2 lg:col-span-4 pt-2 border-t border-border/40 flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-muted-foreground">
                  {project.clientAddress && (
                    <div className="flex-1">
                      <span className="font-medium text-foreground">Alamat:</span> {project.clientAddress}
                    </div>
                  )}
                  {project.notes && (
                    <div className="flex-1">
                      <span className="font-medium text-foreground">Catatan:</span> {project.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border/60 p-4 sm:p-6 space-y-4 bg-muted/5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Status Pembayaran Klien</span>
                </div>
                {totalPaidByClient >= poTotal && poTotal > 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5">
                    ✓ Lunas (100%)
                  </Badge>
                ) : totalPaidByClient > 0 ? (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5">
                    Termin ({paymentPercent}%)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-medium px-2.5 py-0.5">
                    Belum Dibayar
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${totalPaidByClient >= poTotal && poTotal > 0 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, Math.max(0, paymentPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                  <span>Diterima: <strong className="text-foreground font-semibold">{formatCurrency(totalPaidByClient)}</strong> ({paymentPercent}%)</span>
                  <span>Sisa Tagihan: <strong className={remainingClientBill > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 font-semibold'}>{formatCurrency(remainingClientBill)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-background border border-border/70">
                  <span className="text-[11px] text-muted-foreground block font-medium">Total Penjualan (PO)</span>
                  <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">{formatCurrency(poTotal)}</p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/70">
                  <span className="text-[11px] text-muted-foreground block font-medium">Total Pengeluaran</span>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">{formatCurrency(totalCost)}</p>
                  {totalRabMenunggu > 0 && (
                    <span className="text-[10px] text-muted-foreground block mt-0.5 font-normal">
                      Sudah Keluar: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(totalCashPaid)}</strong>
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/70">
                  <span className="text-[11px] text-muted-foreground block font-medium">Uang Masuk (Kas)</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">{formatCurrency(totalPaidByClient)}</p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/70">
                  <span className="text-[11px] text-muted-foreground block font-medium">Estimasi Laba Bersih</span>
                  <p className={`text-base font-bold mt-0.5 tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(profit)}
                  </p>
                  <span className="text-[10px] text-muted-foreground block mt-0.5 font-normal">
                    Arus Kas: <strong className={`font-semibold ${realizedCashProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(realizedCashProfit)}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Kolom 1: Uang Masuk dari Klien */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      Riwayat Pembayaran Klien ({clientPayments.length})
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Total: {formatCurrency(totalPaidByClient)}
                    </span>
                  </div>

                  {clientPayments.length === 0 ? (
                    <div className="p-3 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs">
                      Belum ada pembayaran klien yang dicatat.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border bg-background overflow-hidden max-h-60 overflow-y-auto">
                      {clientPayments.map((p: any) => (
                        <div key={p.id} className="p-2.5 sm:px-3 flex items-center justify-between gap-2.5 text-xs hover:bg-muted/30 transition-colors">
                          <div className="min-w-0 flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0 font-semibold ${p.type === 'LUNAS' ? 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'}`}
                            >
                              {p.type === 'LUNAS' ? 'LUNAS' : `TERMIN ${p.terminNo || ''}`}
                            </Badge>
                            <span className="font-semibold text-foreground truncate">{p.title}</span>
                            <span className="text-muted-foreground text-[11px]">
                              {formatDate(p.date)} · {p.paymentMethod}
                            </span>
                            {p.invoiceUrl && (
                              <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5">
                                <FileText className="w-3 h-3" /> [Inv]
                              </a>
                            )}
                            {p.proofUrl && (
                              <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-[11px] inline-flex items-center gap-0.5">
                                <FileCheck className="w-3 h-3" /> [Bukti]
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(p.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletePaymentId(p.id)}
                              title="Hapus pembayaran ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Kolom 2: Uang Keluar (Realisasi Pengeluaran RAB) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                      Riwayat Pengeluaran Realisasi ({rabRealisasiList.length})
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      Total: {formatCurrency(totalCost)}
                    </span>
                  </div>

                  {rabRealisasiList.length === 0 ? (
                    <div className="p-3 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs">
                      Belum ada realisasi pengeluaran yang dicatat di RAB.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border bg-background overflow-hidden max-h-60 overflow-y-auto">
                      {rabRealisasiList.map((r: any) => (
                        <div key={r.id} className="p-2.5 sm:px-3 flex items-center justify-between gap-2.5 text-xs hover:bg-muted/30 transition-colors">
                          <div className="min-w-0 flex items-center gap-2 flex-wrap">
                            {r.statusBayar === 'sudah_dibayar' ? (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Sudah Dibayar
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                                Menunggu Bayar
                              </Badge>
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {r.vendor?.name || r.vendorNama || r.rabItem?.namaItem || r.rabTopik?.nama || 'Pengeluaran Proyek'}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {formatDate(r.tanggalBayar || r.tanggalInvoice || r.createdAt)}
                            </span>
                            {r.fileBuktiUrl && (
                              <a href={r.fileBuktiUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[11px]">
                                [Invoice]
                              </a>
                            )}
                            {r.buktiBayarUrl && (
                              <a href={r.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-[11px]">
                                [Transfer]
                              </a>
                            )}
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                            {formatCurrency(r.jumlah)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 p-4 sm:p-6 space-y-3.5 bg-muted/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Catatan Progres Pekerjaan</span>
              </div>

              <div className="flex gap-2.5">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ketik catatan progres pekerjaan proyek..."
                  rows={2}
                  className="flex-1 text-xs resize-none bg-background"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={submittingNote || !noteContent.trim()}
                  className="self-end h-8 text-xs px-3.5 bg-primary font-medium"
                >
                  {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tambah'}
                </Button>
              </div>

              <ScrollArea className="max-h-48 pr-2">
                <div className="space-y-2">
                  {(project.progressNotes || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Belum ada catatan progres pekerjaan</p>
                  ) : (
                    project.progressNotes.map((note: any) => (
                      <div key={note.id} className="p-2.5 rounded-xl bg-background border border-border/70 text-xs">
                        <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {note.createdBy || 'Staff'} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB: RAB ─── */}
        <TabsContent value="rab" className="mt-4">
          {isPengadaan ? (
            /* Model RAB Pengadaan (Item RAB & Pembelian + Biaya Tambahan) */
            <div className="space-y-6">
          {/* Items with purchases */}
          <Card>
            <CardHeader className="p-4 sm:px-6 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Item RAB & Pembelian</CardTitle>
                    {project.items && project.items.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({project.items.length} item)
                      </span>
                    )}
                  </div>
                  <CardDescription>Lacak kebutuhan, kekurangan pembelian, dan realisasi biaya setiap item</CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-2xs font-semibold"
                    onClick={() => {
                      setAddItemForm({
                        itemId: '',
                        itemCode: '',
                        itemName: '',
                        qty: '1',
                        unit: 'pcs',
                        unitPrice: '0',
                        deadline: '',
                      })
                      setAddItemModalOpen(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Item RAB
                  </Button>
                  {project.items && project.items.length > 0 && (() => {
                    const completedCount = project.items.filter((i: any) => {
                      const totalBuyQty = i.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
                      return totalBuyQty >= i.qty
                    }).length
                    const pendingCount = project.items.length - completedCount
                    return (
                      <>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          ✓ {completedCount} Lengkap
                        </Badge>
                        {pendingCount > 0 && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                            ⚠️ {pendingCount} Belum Lengkap
                          </Badge>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
              {(project.items || []).length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                  <p className="font-medium text-foreground">Belum ada item RAB</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tambahkan item proyek untuk mulai melacak pembelian.</p>
                  <Button
                    size="sm"
                    className="mt-3 text-xs gap-1.5"
                    onClick={() => {
                      setAddItemForm({
                        itemId: '',
                        itemCode: '',
                        itemName: '',
                        qty: '1',
                        unit: 'pcs',
                        unitPrice: '0',
                        deadline: '',
                      })
                      setAddItemModalOpen(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Item RAB
                  </Button>
                </div>
              ) : (
                <>
                  {/* ===== MOBILE: Card list ===== */}
                  <div className="md:hidden divide-y-4 divide-slate-200 dark:divide-slate-800 border-t border-border">
                    {project.items.map((item: any, idx: number) => {
                      const itemBuyTotal = item.purchases?.reduce((s: number, p: any) => s + p.totalBuy, 0) || 0
                      const totalQtyPurchased = item.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
                      const remainingQty = item.qty - totalQtyPurchased
                      const margin = item.total - itemBuyTotal
                      const isEven = idx % 2 === 0
                      return (
                        <div
                          key={item.id}
                          className={`p-4 space-y-3 ${isEven ? 'bg-background' : 'bg-slate-50/70 dark:bg-slate-900/30'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5 border border-primary/20">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate text-foreground">{item.itemName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  ID: {item.itemId}{item.itemCode ? ` | Kode: ${item.itemCode}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => openAddPurchase(item)}
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Beli
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditItemModal(item)}
                                title="Edit item RAB"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteItemConfirm(item)}
                                title="Hapus item RAB"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs bg-card/60 p-2.5 rounded-lg border border-border/60">
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Target Qty</p>
                              <p className="font-semibold truncate mt-0.5">{formatNumber(item.qty)} {item.unit}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Status Pembelian</p>
                              <div className="mt-0.5">
                                {remainingQty > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                                    Kurang: {formatNumber(remainingQty)} {item.unit}
                                  </span>
                                ) : remainingQty === 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                    ✓ Lengkap ({formatNumber(totalQtyPurchased)})
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300">
                                    + Lebih {formatNumber(Math.abs(remainingQty))}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Harga Jual</p>
                              <p className="truncate mt-0.5">{formatCurrency(item.unitPrice)}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Deadline</p>
                              <p className="truncate mt-0.5">{formatDate(item.deadline)}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Total RAB</p>
                              <p className="truncate mt-0.5 font-semibold">{formatCurrency(item.total)}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted-foreground">Total Beli</p>
                              <p className="truncate mt-0.5 font-semibold text-destructive">{formatCurrency(itemBuyTotal)}</p>
                            </div>
                            <div className="min-w-0 col-span-2">
                              <p className="text-muted-foreground">Margin</p>
                              <p className={`truncate mt-0.5 font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(margin)}
                              </p>
                            </div>
                          </div>

                          {item.purchases?.length > 0 && (
                            <div className="ml-2 pl-3 border-l-2 border-primary/50 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                <CornerDownRight className="w-3.5 h-3.5" />
                                <span>Riwayat Pembelian ({item.purchases.length})</span>
                              </div>
                              <div className="rounded-md border border-border bg-card divide-y divide-border">
                                {item.purchases.map((p: any) => (
                                  <div key={p.id} className="p-2.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate">{p.vendor?.name || 'Tanpa vendor'}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                          × {formatNumber(p.qty)} @ {formatCurrency(p.buyPrice)} = <strong className="text-foreground">{formatCurrency(p.totalBuy)}</strong>
                                        </p>
                                      </div>
                                      {p.status === 'SUCCESS' ? (
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
                                        📅 {formatDate(p.requestDate || p.createdAt)}
                                      </span>
                                      {p.status === 'SUCCESS' ? (
                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                                          ✓ {formatDate(p.paymentDate || p.updatedAt)}
                                        </span>
                                      ) : (
                                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          ⏳ Menunggu Bayar
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2.5 pt-1">
                                      {p.docUrl && (
                                        <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                          [Inv/Ref]
                                        </a>
                                      )}
                                      {p.paymentProofUrl && (
                                        <a href={p.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                          [Bukti]
                                        </a>
                                      )}
                                      {p.status === 'REQUEST' && (
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                          onClick={() => openPay(p)}
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

                  {/* ===== DESKTOP: Tabel ===== */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60 border-b-2 border-border">
                          <TableHead className="w-[40px] text-center">#</TableHead>
                          <TableHead className="min-w-[190px]">Item</TableHead>
                          <TableHead className="text-right min-w-[140px]">Qty & Kebutuhan</TableHead>
                          <TableHead className="text-right min-w-[120px]">Harga Jual</TableHead>
                          <TableHead className="text-center min-w-[110px]">Deadline</TableHead>
                          <TableHead className="text-right min-w-[120px]">Total RAB</TableHead>
                          <TableHead className="text-right min-w-[120px]">Total Beli</TableHead>
                          <TableHead className="text-right min-w-[120px]">Margin</TableHead>
                          <TableHead className="text-right min-w-[130px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.items.map((item: any, idx: number) => {
                          const itemBuyTotal = item.purchases?.reduce((s: number, p: any) => s + p.totalBuy, 0) || 0
                          const totalQtyPurchased = item.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
                          const remainingQty = item.qty - totalQtyPurchased
                          const margin = item.total - itemBuyTotal
                          const hasPurchases = item.purchases && item.purchases.length > 0
                          const isEven = idx % 2 === 0
                          const groupBg = isEven ? 'bg-background' : 'bg-slate-50/70 dark:bg-slate-900/30'
                          
                          return (
                            <Fragment key={item.id}>
                              {/* Row Utama Item */}
                              <TableRow className={`${groupBg} ${!hasPurchases ? 'border-b-4 border-slate-200 dark:border-slate-800' : 'border-b-0'}`}>
                                <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                                    {idx + 1}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold text-foreground text-sm">{item.itemName}</div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5">ID: {item.itemId} {item.itemCode ? `| Kode: ${item.itemCode}` : ''}</div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <div className="font-semibold text-foreground">{formatNumber(item.qty)} {item.unit}</div>
                                  <div className="text-[11px] text-muted-foreground">Dibeli: {formatNumber(totalQtyPurchased)}</div>
                                  {remainingQty > 0 ? (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                                      Kurang: {formatNumber(remainingQty)} {item.unit}
                                    </span>
                                  ) : remainingQty === 0 ? (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                      ✓ Lengkap
                                    </span>
                                  ) : (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300">
                                      + Lebih {formatNumber(Math.abs(remainingQty))} {item.unit}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-center text-sm">{formatDate(item.deadline)}</TableCell>
                                <TableCell className="text-right text-sm font-semibold">{formatCurrency(item.total)}</TableCell>
                                <TableCell className="text-right text-sm font-semibold text-destructive">{formatCurrency(itemBuyTotal)}</TableCell>
                                <TableCell className={`text-right text-sm font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {formatCurrency(margin)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs"
                                      onClick={() => openAddPurchase(item)}
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                      Beli
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                      onClick={() => openEditItemModal(item)}
                                      title="Edit item RAB"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => setDeleteItemConfirm(item)}
                                      title="Hapus item RAB"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Row Riwayat Pembelian (Child) */}
                              {hasPurchases && (
                                <TableRow key={`${item.id}-purchases`} className={`${groupBg} border-b-4 border-slate-200 dark:border-slate-800`}>
                                  <TableCell colSpan={9} className="pt-0 pb-3 px-3 sm:px-5">
                                    <div className="ml-7 rounded-lg border border-border/80 bg-background/95 dark:bg-card/90 shadow-2xs border-l-4 border-l-primary p-3 space-y-2">
                                      {/* Sub-header penjelas relasi item */}
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 pb-1 border-b border-border/40">
                                        <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>Riwayat Pembelian untuk:</span>
                                        <span className="text-primary font-bold underline decoration-primary/40 underline-offset-2">{item.itemName}</span>
                                        <span className="text-[11px] text-muted-foreground font-normal ml-1">({item.purchases.length} transaksi)</span>
                                      </div>

                                      {/* List Transaksi Pembelian */}
                                      <div className="space-y-1.5">
                                        {item.purchases.map((p: any) => (
                                          <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs py-1.5 border-b border-border/40 last:border-0">
                                            {p.status === 'SUCCESS' ? (
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

                                            <span className="font-semibold text-foreground">{p.vendor?.name || 'Tanpa vendor'}</span>
                                            <span className="text-muted-foreground">× {formatNumber(p.qty)} @ {formatCurrency(p.buyPrice)}</span>
                                            <span className="font-semibold text-foreground">= {formatCurrency(p.totalBuy)}</span>

                                            {/* Tanggal Pengajuan & Tanggal Sudah Dibayar */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                              <span className="bg-muted/70 text-muted-foreground px-2 py-0.5 rounded border border-border/60">
                                                📅 Diajukan: <strong className="text-foreground font-medium">{formatDate(p.requestDate || p.createdAt)}</strong>
                                              </span>
                                              {p.status === 'SUCCESS' ? (
                                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                                  ✓ Dibayar: {formatDate(p.paymentDate || p.updatedAt)}
                                                </span>
                                              ) : (
                                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                  ⏳ Menunggu Bayar
                                                </span>
                                              )}
                                            </div>

                                            {/* Actions & Links */}
                                            <div className="flex items-center gap-2 ml-auto">
                                              {p.docUrl && (
                                                <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                                  [Inv/Referensi]
                                                </a>
                                              )}
                                              {p.paymentProofUrl && (
                                                <a href={p.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                                                  [Bukti Transfer]
                                                </a>
                                              )}
                                              {p.status === 'REQUEST' && (
                                                <Button
                                                  size="sm"
                                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                  onClick={() => openPay(p)}
                                                >
                                                  Konfirmasi Bayar
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
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader className="p-4 sm:px-6 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Biaya Tambahan</CardTitle>
                  <CardDescription>Aksesoris, pengiriman, operasional, dll.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setAddCostOpen(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Biaya
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 mt-4 sm:mt-0">
              {(project.additionalCosts || []).length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                  <p className="font-medium text-foreground">Belum ada biaya tambahan</p>
                  <p className="text-sm">Catat aksesoris, pengiriman, atau biaya operasional di sini.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.additionalCosts.map((cost: any) => (
                    <div key={cost.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-border">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{cost.category}</Badge>
                          <span className="text-sm font-medium text-foreground break-words">{cost.description}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(cost.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cost.vendorName || 'Tanpa vendor'}
                          {cost.notes && ` · ${cost.notes}`}
                        </p>
                        {cost.docUrl && (
                          <a href={cost.docUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">
                            [Lihat Bukti]
                          </a>
                        )}
                      </div>
                      <span className="text-sm font-medium text-destructive sm:text-right shrink-0">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Total Biaya Tambahan</span>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(totalAddCosts)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RAB Purchase Dialog */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Pembelian Item</DialogTitle>
                <DialogDescription>Catat pengajuan pembelian untuk item proyek ini</DialogDescription>
              </DialogHeader>

              {(() => {
                const selectedItem = (project?.items || []).find((i: any) => i.id === selectedItemId)
                if (!selectedItem) return null
                const selectedItemBuyQty = selectedItem.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
                const selectedItemRemainingQty = selectedItem.qty - selectedItemBuyQty

                return (
                  <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1.5 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-sm">{selectedItem.itemName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedItem.itemId}{selectedItem.itemCode ? ` • ${selectedItem.itemCode}` : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Target Kebutuhan:</span>
                        <span className="font-medium text-foreground">{formatNumber(selectedItem.qty)} {selectedItem.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Sudah Dibeli:</span>
                        <span className="font-medium text-foreground">{formatNumber(selectedItemBuyQty)} {selectedItem.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Kekurangan:</span>
                        <span className={`font-semibold ${selectedItemRemainingQty > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {selectedItemRemainingQty > 0 ? `${formatNumber(selectedItemRemainingQty)} ${selectedItem.unit}` : 'Lengkap'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <form onSubmit={handleAddPurchase} className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipe Vendor</Label>
                    <Select value={vendorType} onValueChange={(v: any) => setVendorType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXISTING">Pilih dari Database</SelectItem>
                        <SelectItem value="NEW">Buat Vendor Baru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Pengajuan *</Label>
                    <Input
                      type="date"
                      value={purchaseForm.requestDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, requestDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {vendorType === 'EXISTING' ? (
                  <div className="space-y-2">
                    <Label>Vendor *</Label>
                    <Select value={purchaseForm.vendorId} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, vendorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih vendor" /></SelectTrigger>
                      <SelectContent>
                        {vendors.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Nama Vendor Baru *</Label>
                    <Input value={purchaseForm.vendorName} onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })} placeholder="Ketik nama vendor" required />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Jumlah (Qty) *</Label>
                      {(() => {
                        const selItem = (project?.items || []).find((i: any) => i.id === selectedItemId)
                        if (!selItem) return null
                        const buyQty = selItem.purchases?.reduce((s: number, p: any) => s + (p.qty || 0), 0) || 0
                        const rem = selItem.qty - buyQty
                        if (rem <= 0) return null
                        return (
                          <button
                            type="button"
                            onClick={() => setPurchaseForm({ ...purchaseForm, qty: formatNumber(rem) })}
                            className="text-[11px] text-primary hover:underline"
                          >
                            Isi Sisa ({formatNumber(rem)})
                          </button>
                        )
                      })()}
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={purchaseForm.qty}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: formatThousandSeparator(e.target.value) })}
                      placeholder="Contoh: 10"
                      required
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Satuan: {(project?.items || []).find((i: any) => i.id === selectedItemId)?.unit || 'unit'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Harga Beli Satuan (Rp) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">Rp</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={purchaseForm.buyPrice}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: formatThousandSeparator(e.target.value) })}
                        className="pl-9"
                        placeholder="Contoh: 150.000"
                        required
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Gunakan angka dengan separator ribuan otomatis</span>
                  </div>
                </div>

                {/* Subtotal Preview */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal Pengajuan Pembelian:</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(parseFormattedNumber(purchaseForm.qty) * parseFormattedNumber(purchaseForm.buyPrice))}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Upload Proforma Invoice / Referensi (Opsional)</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setPurchaseDocFile(e.target.files?.[0] || null)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Upload nota/invoice dari seller sebagai referensi harga / tagihan.</p>
                </div>

                <div className="space-y-2">
                  <Label>Catatan (No Rekening / Info Pembayaran)</Label>
                  <Textarea value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="Masukkan nomor rekening, nama bank, atau catatan transfer..." rows={2} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPurchaseOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submittingPurchase}>
                    {submittingPurchase ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Ajukan Pembelian
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* RAB Pay Dialog */}
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                <DialogDescription>Konfirmasi pelunasan request pembelian item</DialogDescription>
              </DialogHeader>

              {selectedPurchase && (
                <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1 mt-1">
                  <div className="font-semibold text-foreground text-sm">{selectedPurchase.projectItem?.itemName}</div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Vendor: <strong className="text-foreground">{selectedPurchase.vendor?.name || 'Tanpa vendor'}</strong></span>
                    <span>Total: <strong className="text-foreground">{formatCurrency(selectedPurchase.totalBuy)}</strong></span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Diajukan: {formatDate(selectedPurchase.requestDate || selectedPurchase.createdAt)}
                  </div>
                </div>
              )}

              <form onSubmit={handlePayPurchase} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Tanggal Sudah Dibayar *</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Tanggal dana ditransfer / dibayarkan ke vendor.</p>
                </div>

                <div className="space-y-2">
                  <Label>Upload Bukti Transfer</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setPayProofFile(e.target.files?.[0] || null)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Struk resi transfer dari bank / e-wallet.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submittingPay} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {submittingPay ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Konfirmasi & Lunas
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Additional Cost Dialog */}
          <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Biaya Tambahan</DialogTitle>
                <DialogDescription>Catat biaya tambahan untuk proyek ini</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCost} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={addCostForm.category} onValueChange={(v) => setAddCostForm({ ...addCostForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCESSORIES">Aksesoris</SelectItem>
                      <SelectItem value="SHIPPING">Pengiriman</SelectItem>
                      <SelectItem value="OPERATIONAL">Operasional</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi *</Label>
                  <Input value={addCostForm.description} onChange={(e) => setAddCostForm({ ...addCostForm, description: e.target.value })} placeholder="Deskripsi" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah (Rp) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">Rp</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={addCostForm.amount}
                        onChange={(e) => setAddCostForm({ ...addCostForm, amount: formatThousandSeparator(e.target.value) })}
                        className="pl-9"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal *</Label>
                    <Input type="date" value={addCostForm.date} onChange={(e) => setAddCostForm({ ...addCostForm, date: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vendor / Toko (Opsional)</Label>
                  <Input value={addCostForm.vendorName} onChange={(e) => setAddCostForm({ ...addCostForm, vendorName: e.target.value })} placeholder="Nama toko, warung, SPBU, dll" />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input value={addCostForm.notes} onChange={(e) => setAddCostForm({ ...addCostForm, notes: e.target.value })} placeholder="Catatan opsional" />
                </div>
                <div className="space-y-2">
                  <Label>Upload Bukti Biaya (Opsional)</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setAddCostFile(e.target.files?.[0] || null)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Struk / nota dari pembelian atau pengeluaran.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setAddCostOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submittingCost}>
                    {submittingCost ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Tambah Biaya
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          ) : (
            /* Model RAB Jasa Pekerjaan (RAB Dinamis: Rencana, Realisasi Transaksi per Item, & Export) */
            <RABPlanningModule projectId={projectId} projectStatus={project.status} />
          )}
        </TabsContent>

        {/* ─── TAB: DOCUMENTS ─── */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Surat Jalan */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Surat Jalan</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSjFormOpen(true)}>
                  <Plus className="w-3 h-3" />Buat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.suratJalans || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada surat jalan</p>
              ) : (
                <div className="space-y-2">
                  {project.suratJalans.map((sj: any) => (
                    <div key={sj.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{sj.sjNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(sj.date)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{sj.type}</Badge>
                      </div>
                      {sj.items?.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {sj.items.map((item: any, i: number) => (
                            <div key={i}>{item.description} × {item.qty} {item.unit}</div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => window.open(`/print/surat-jalan/${sj.id}`, '_blank')}>
                          Cetak SJ
                        </Button>
                        <div className="flex items-center gap-2">
                          {sj.returnedFileUrl ? (
                            <a href={sj.returnedFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">
                              Lihat SJ Kembali
                            </a>
                          ) : (
                            <Label className="cursor-pointer text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                              <span>+ Upload SJ Kembali (TTD Klien)</span>
                              <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => {
                                if (e.target.files?.[0]) handleUploadSjReturn(sj.id, e.target.files[0])
                              }} />
                            </Label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BAST */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">BAST</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setBastFormOpen(true)}>
                  <Plus className="w-3 h-3" />Buat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.basts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada BAST</p>
              ) : (
                <div className="space-y-2">
                  {project.basts.map((bast: any) => (
                    <div key={bast.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{bast.bastNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(bast.date)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{bast.type}</Badge>
                      </div>
                      {bast.items?.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {bast.items.map((item: any, i: number) => (
                            <div key={i}>{item.description} × {item.qty} {item.unit}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Invoice</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setInvoiceFormOpen(true)}>
                  <Plus className="w-3 h-3" />Buat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.invoices || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada invoice</p>
              ) : (
                <div className="space-y-2">
                  {project.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{inv.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(inv.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{inv.paymentMethod}</Badge>
                          <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px]">{inv.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-medium">{formatCurrency(inv.items?.reduce((s: number, i: any) => s + i.amount, 0) || 0)}</div>
                      {inv.termins?.length > 0 && (
                        <div className="mt-2 text-xs space-y-1">
                          {inv.termins.map((t: any) => (
                            <div key={t.id} className="flex items-center gap-2 text-muted-foreground">
                              <span>Termin {t.terminNo}: {t.percentage}% = {formatCurrency(t.amount)}</span>
                              <Badge variant={t.status === 'PAID' ? 'default' : 'outline'} className="text-[9px] px-1 py-0">{t.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kuitansi */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Kuitansi</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setKuitansiFormOpen(true)}>
                  <Plus className="w-3 h-3" />Buat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.kuitansis || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada kuitansi</p>
              ) : (
                <div className="space-y-2">
                  {project.kuitansis.map((k: any) => (
                    <div key={k.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{k.kuitansiNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(k.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{k.paymentMethod}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-medium">{formatCurrency(k.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Form Dialogs */}
      {project && (
        <>
          <SuratJalanForm
            open={sjFormOpen}
            onOpenChange={setSjFormOpen}
            projectId={projectId}
            projectType={project.type}
            projectItems={project.items || []}
            onCreated={fetchProject}
          />
          <BASTForm
            open={bastFormOpen}
            onOpenChange={setBastFormOpen}
            projectId={projectId}
            projectType={project.type}
            suratJalans={project.suratJalans || []}
            onCreated={fetchProject}
          />
          <InvoiceForm
            open={invoiceFormOpen}
            onOpenChange={setInvoiceFormOpen}
            projectId={projectId}
            projectItems={project.items || []}
            onCreated={fetchProject}
          />
          <KuitansiForm
            open={kuitansiFormOpen}
            onOpenChange={setKuitansiFormOpen}
            projectId={projectId}
            invoices={project.invoices || []}
            basts={project.basts || []}
            onCreated={fetchProject}
          />

          {/* Dialog Catat Pembayaran dari Klien */}
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Catat Pembayaran dari Klien
                </DialogTitle>
                <DialogDescription>
                  Catat penerimaan pembayaran pesanan proyek (bisa langsung pelunasan 100% atau termin bertahap).
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddPayment} className="space-y-4 pt-1">
                {/* Tipe Pembayaran (Lunas vs Termin) */}
                <div>
                  <Label className="text-xs font-semibold text-foreground">Jenis Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <Button
                      type="button"
                      variant={paymentForm.type === 'LUNAS' ? 'default' : 'outline'}
                      className={`h-9 text-xs justify-center font-medium ${paymentForm.type === 'LUNAS' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={() => {
                        setPaymentForm((prev) => ({
                          ...prev,
                          type: 'LUNAS',
                          title: 'Pelunasan Pesanan 100%',
                          amount: formatNumber(remainingClientBill > 0 ? remainingClientBill : poTotal),
                        }))
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Langsung Lunas (100%)
                    </Button>
                    <Button
                      type="button"
                      variant={paymentForm.type === 'TERMIN' ? 'default' : 'outline'}
                      className={`h-9 text-xs justify-center font-medium ${paymentForm.type === 'TERMIN' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                      onClick={() => {
                        const nextTermin = (project.payments?.length || 0) + 1
                        setPaymentForm((prev) => ({
                          ...prev,
                          type: 'TERMIN',
                          terminNo: String(nextTermin),
                          title: `Termin ${nextTermin}`,
                        }))
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Termin (Bertahap)
                    </Button>
                  </div>
                </div>

                {/* Jika Termin, input termin ke-berapa */}
                {paymentForm.type === 'TERMIN' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Termin Ke</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-9 text-xs"
                        value={paymentForm.terminNo}
                        onChange={(e) => setPaymentForm((prev) => ({
                          ...prev,
                          terminNo: e.target.value,
                          title: `Termin ${e.target.value}`,
                        }))}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Judul / Keterangan Pembayaran</Label>
                      <Input
                        className="h-9 text-xs"
                        value={paymentForm.title}
                        onChange={(e) => setPaymentForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="misal: Termin 1 (DP 50%)"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentForm.type === 'LUNAS' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Judul / Keterangan Pembayaran</Label>
                    <Input
                      className="h-9 text-xs"
                      value={paymentForm.title}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="misal: Pelunasan 100% Pesanan"
                      required
                    />
                  </div>
                )}

                {/* Nominal Pembayaran (dengan separator ribuan) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Nominal Pembayaran (Rp) *</Label>
                    {remainingClientBill > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Sisa Tagihan: <strong className="text-foreground">{formatCurrency(remainingClientBill)}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      className="pl-9 h-9 text-sm font-semibold"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((prev) => ({
                        ...prev,
                        amount: formatThousandSeparator(e.target.value),
                      }))}
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Tombol Cepat Pengisian */}
                  {remainingClientBill > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground">Isi Cepat:</span>
                      <button
                        type="button"
                        onClick={() => setPaymentForm((prev) => ({
                          ...prev,
                          amount: formatNumber(remainingClientBill),
                        }))}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-colors"
                      >
                        Sisa Tagihan ({formatCurrency(remainingClientBill)})
                      </button>
                      {poTotal > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPaymentForm((prev) => ({
                              ...prev,
                              amount: formatNumber(Math.round(poTotal * 0.5)),
                            }))}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-colors"
                          >
                            50% ({formatCurrency(Math.round(poTotal * 0.5))})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentForm((prev) => ({
                              ...prev,
                              amount: formatNumber(Math.round(poTotal * 0.3)),
                            }))}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-colors"
                          >
                            30% ({formatCurrency(Math.round(poTotal * 0.3))})
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Tanggal & Metode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tanggal Pembayaran *</Label>
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Metode Pembayaran</Label>
                    <Select
                      value={paymentForm.paymentMethod}
                      onValueChange={(val) => setPaymentForm((prev) => ({ ...prev, paymentMethod: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                        <SelectItem value="CASH">Tunai / Cash</SelectItem>
                        <SelectItem value="GIRO">Giro / Cek</SelectItem>
                        <SelectItem value="OTHER">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Nomor Invoice & Bukti File Invoice */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/60 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nomor Invoice Tagihan (Opsional)</Label>
                    <Input
                      className="h-8 text-xs bg-background"
                      value={paymentForm.invoiceNumber}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="misal: INV-2026-001"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Upload File Invoice Tagihan (PDF / Gambar)</Label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      className="h-8 text-xs bg-background"
                      onChange={(e) => setPaymentInvoiceFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Lampirkan dokumen invoice yang telah dikirim ke klien.
                    </p>
                  </div>
                </div>

                {/* Bukti Transfer / Pembayaran Klien */}
                <div className="space-y-1">
                  <Label className="text-xs">Upload Bukti Transfer / Pembayaran Klien (PDF / Gambar)</Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    className="h-8 text-xs"
                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Bukti mutasi rekening, struk transfer ATM, atau kuitansi tanda terima.
                  </p>
                </div>

                {/* Catatan */}
                <div className="space-y-1">
                  <Label className="text-xs">Catatan Tambahan</Label>
                  <Textarea
                    className="text-xs resize-none h-16"
                    placeholder="Catatan rekening bank tujuan, nomor referensi mutasi, dll..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menyimpan...</>
                    ) : (
                      'Simpan Pembayaran'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Confirm Hapus Pembayaran */}
          <AlertDialog open={!!deletePaymentId} onOpenChange={(open) => { if (!open) setDeletePaymentId(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Hapus Catatan Pembayaran?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus data pembayaran ini? Total kas masuk dan riwayat pembayaran akan dikurangi kembali.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingPayment}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={deletingPayment}
                  onClick={async (e) => {
                    e.preventDefault()
                    if (deletePaymentId) await handleDeletePayment(deletePaymentId)
                  }}
                >
                  {deletingPayment ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menghapus...</> : 'Ya, Hapus'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ─── MODAL: Edit Proyek (Form Lengkap) ─── */}
          <ProjectForm
            open={editProjectModalOpen}
            onOpenChange={setEditProjectModalOpen}
            onCreated={fetchProject}
            projectToEdit={project}
            onUpdated={fetchProject}
          />

          {/* ─── MODAL: Edit Item RAB Pengadaan ─── */}
          <Dialog open={!!editItemModal} onOpenChange={(open) => { if (!open) setEditItemModal(null) }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Edit className="w-4 h-4 text-primary" />
                  Edit Item RAB Pengadaan
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Perbaiki rincian item barang, kuantitas, atau harga jual satuan.
                </DialogDescription>
              </DialogHeader>

              {editItemModal && (
                <form onSubmit={handleSaveEditItem} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Item / Barang *</Label>
                    <Input
                      className="h-9 text-xs"
                      value={editItemForm.itemName}
                      onChange={(e) => setEditItemForm({ ...editItemForm, itemName: e.target.value })}
                      placeholder="Nama barang / produk pengadaan"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">ID Item (maks 3 digit)</Label>
                      <Input
                        className="h-9 text-xs"
                        value={editItemForm.itemId}
                        onChange={(e) => setEditItemForm({ ...editItemForm, itemId: e.target.value })}
                        placeholder="001"
                        maxLength={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Kode Barang</Label>
                      <Input
                        className="h-9 text-xs"
                        value={editItemForm.itemCode}
                        onChange={(e) => setEditItemForm({ ...editItemForm, itemCode: e.target.value })}
                        placeholder="Contoh: KBL-01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Target Kuantitas (Qty) *</Label>
                      <Input
                        className="h-9 text-xs font-semibold"
                        value={editItemForm.qty}
                        onChange={(e) => setEditItemForm({ ...editItemForm, qty: formatThousandSeparator(e.target.value) })}
                        placeholder="1"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Satuan *</Label>
                      <Input
                        className="h-9 text-xs"
                        value={editItemForm.unit}
                        onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })}
                        placeholder="pcs / unit / roll"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Harga Jual Satuan (Rp) *</Label>
                      <Input
                        className="h-9 text-xs font-semibold"
                        value={editItemForm.unitPrice}
                        onChange={(e) => setEditItemForm({ ...editItemForm, unitPrice: formatThousandSeparator(e.target.value) })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Deadline Pengadaan</Label>
                      <Input
                        type="date"
                        className="h-9 text-xs"
                        value={editItemForm.deadline}
                        onChange={(e) => setEditItemForm({ ...editItemForm, deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded bg-muted/40 text-xs flex justify-between items-center">
                    <span className="text-muted-foreground">Total Nilai Item:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(parseFormattedNumber(editItemForm.qty) * parseFormattedNumber(editItemForm.unitPrice))}
                    </span>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditItemModal(null)} disabled={submittingItemAction}>
                      Batal
                    </Button>
                    <Button type="submit" size="sm" className="bg-primary text-white" disabled={submittingItemAction}>
                      {submittingItemAction ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menyimpan...</> : 'Simpan Perubahan'}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* ─── MODAL: Tambah Item RAB Pengadaan ─── */}
          <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Plus className="w-4 h-4 text-primary" />
                  Tambah Item RAB Pengadaan
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Tambahkan item barang pengadaan baru ke proyek ini.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveAddItem} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Nama Item / Barang *</Label>
                  <Input
                    className="h-9 text-xs"
                    value={addItemForm.itemName}
                    onChange={(e) => setAddItemForm({ ...addItemForm, itemName: e.target.value })}
                    placeholder="Nama barang / produk pengadaan"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">ID Item (maks 3 digit)</Label>
                    <Input
                      className="h-9 text-xs"
                      value={addItemForm.itemId}
                      onChange={(e) => setAddItemForm({ ...addItemForm, itemId: e.target.value })}
                      placeholder="001"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kode Barang</Label>
                    <Input
                      className="h-9 text-xs"
                      value={addItemForm.itemCode}
                      onChange={(e) => setAddItemForm({ ...addItemForm, itemCode: e.target.value })}
                      placeholder="Contoh: KBL-01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Target Kuantitas (Qty) *</Label>
                    <Input
                      className="h-9 text-xs font-semibold"
                      value={addItemForm.qty}
                      onChange={(e) => setAddItemForm({ ...addItemForm, qty: formatThousandSeparator(e.target.value) })}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Satuan *</Label>
                    <Input
                      className="h-9 text-xs"
                      value={addItemForm.unit}
                      onChange={(e) => setAddItemForm({ ...addItemForm, unit: e.target.value })}
                      placeholder="pcs / unit / roll"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Harga Jual Satuan (Rp) *</Label>
                    <Input
                      className="h-9 text-xs font-semibold"
                      value={addItemForm.unitPrice}
                      onChange={(e) => setAddItemForm({ ...addItemForm, unitPrice: formatThousandSeparator(e.target.value) })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Deadline Pengadaan</Label>
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={addItemForm.deadline}
                      onChange={(e) => setAddItemForm({ ...addItemForm, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/40 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Total Nilai Item:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(parseFormattedNumber(addItemForm.qty) * parseFormattedNumber(addItemForm.unitPrice))}
                  </span>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddItemModalOpen(false)} disabled={submittingItemAction}>
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-primary text-white" disabled={submittingItemAction}>
                    {submittingItemAction ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menambahkan...</> : 'Tambah Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* ─── CONFIRM: Hapus Item RAB Pengadaan ─── */}
          <AlertDialog open={!!deleteItemConfirm} onOpenChange={(open) => { if (!open) setDeleteItemConfirm(null) }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Hapus Item RAB?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus item <strong>{deleteItemConfirm?.itemName}</strong>?
                  {deleteItemConfirm?.purchases && deleteItemConfirm.purchases.length > 0 && (
                    <span className="block mt-1 text-rose-600 font-semibold">
                      Peringatan: Item ini memiliki {deleteItemConfirm.purchases.length} catatan riwayat pembelian yang juga akan dihapus.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submittingItemAction}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={submittingItemAction}
                  onClick={async (e) => {
                    e.preventDefault()
                    await handleDeleteItem()
                  }}
                >
                  {submittingItemAction ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menghapus...</> : 'Ya, Hapus Item'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
