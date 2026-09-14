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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SuratJalanForm,
  BASTForm,
  InvoiceForm,
  KuitansiForm,
} from './DocumentFormDialogs'
import { useToast } from '@/hooks/use-toast'

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  // RAB Purchase dialog
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [vendorType, setVendorType] = useState<'EXISTING' | 'NEW'>('EXISTING')
  const [purchaseForm, setPurchaseForm] = useState({ vendorId: '', vendorName: '', qty: '1', buyPrice: '0', notes: '' })
  const [purchaseDocFile, setPurchaseDocFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [submittingPurchase, setSubmittingPurchase] = useState(false)

  // RAB Pay dialog
  const [payOpen, setPayOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [payProofFile, setPayProofFile] = useState<File | null>(null)
  const [submittingPay, setSubmittingPay] = useState(false)

  // Additional cost dialog
  const [addCostOpen, setAddCostOpen] = useState(false)
  const [addCostForm, setAddCostForm] = useState({ category: 'ACCESSORIES', description: '', amount: '0', vendorName: '', notes: '', date: new Date().toISOString().split('T')[0] })
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

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false)

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
    if (purchaseOpen || addCostOpen) {
      fetch('/api/vendors')
        .then((r) => r.json())
        .then((data) => { if (data.success) setVendors(data.data) })
        .catch(() => {})
    }
  }, [purchaseOpen, addCostOpen])

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
          qty: parseFloat(purchaseForm.qty) || 0,
          buyPrice: parseFloat(purchaseForm.buyPrice) || 0,
          docUrl,
          notes: purchaseForm.notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembelian Ditambahkan', description: 'Request pembelian RAB telah dicatat.' })
        setPurchaseOpen(false)
        setVendorType('EXISTING')
        setPurchaseForm({ vendorId: '', vendorName: '', qty: '1', buyPrice: '0', notes: '' })
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
          paymentProofUrl: paymentProofUrl || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Pembayaran Dikonfirmasi' })
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
          amount: parseFloat(addCostForm.amount) || 0,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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

  // Calculate Laba/Rugi
  const poTotal = project.items?.reduce((s: number, i: any) => s + i.total, 0) || 0
  const totalPurchases = project.items?.reduce(
    (s: number, i: any) => s + (i.purchases?.reduce((ps: number, p: any) => ps + p.totalBuy, 0) || 0),
    0
  ) || 0
  const totalAddCosts = project.additionalCosts?.reduce((s: number, c: any) => s + c.amount, 0) || 0
  const totalCost = totalPurchases + totalAddCosts
  const profit = poTotal - totalCost

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
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
        <div className="flex gap-2">
          {project.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={statusUpdating}>
              Mulai Proyek
            </Button>
          )}
          {project.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => handleStatusUpdate('COMPLETED')} disabled={statusUpdating}>
              Selesai
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info"><FileText className="w-3.5 h-3.5 mr-1.5" />Info</TabsTrigger>
          <TabsTrigger value="rab"><Package className="w-3.5 h-3.5 mr-1.5" />RAB</TabsTrigger>
          <TabsTrigger value="documents"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Dokumen</TabsTrigger>
        </TabsList>

        {/* ─── TAB: INFO ─── */}
        <TabsContent value="info" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Project Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ringkasan Proyek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Kode Proyek:</span><p className="font-medium">{project.projectCode}</p></div>
                  <div><span className="text-muted-foreground">Tipe:</span><p className="font-medium">{project.type}</p></div>
                  <div>
                    <span className="text-muted-foreground">Nomor PO:</span>
                    <p className="font-medium">
                      {project.poNumber || '—'}
                      {project.poFileUrl && (
                        <a href={project.poFileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline text-xs">
                          [Lihat File]
                        </a>
                      )}
                    </p>
                  </div>
                  <div><span className="text-muted-foreground">PIC Internal:</span><p className="font-medium">{project.internalPic || '—'}</p></div>
                  <div><span className="text-muted-foreground">Tanggal Mulai:</span><p className="font-medium">{formatDate(project.startDate)}</p></div>
                  <div><span className="text-muted-foreground">Tanggal Selesai:</span><p className="font-medium">{formatDate(project.endDate)}</p></div>
                </div>
                <Separator />
                <div><span className="text-muted-foreground">Klien:</span><p className="font-medium">{project.client?.name}</p></div>
                <div><span className="text-muted-foreground">PIC Klien:</span><p className="font-medium">{project.clientPicName || '—'} {project.clientPicPhone ? `· ${project.clientPicPhone}` : ''}</p></div>
                {project.clientAddress && <div><span className="text-muted-foreground">Alamat:</span><p className="font-medium">{project.clientAddress}</p></div>}
                {project.notes && <div><span className="text-muted-foreground">Catatan:</span><p className="font-medium whitespace-pre-wrap">{project.notes}</p></div>}
              </CardContent>
            </Card>

            {/* Laba Rugi Calculator */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Laba / Rugi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total PO (RAB)</span>
                  <span className="font-medium">{formatCurrency(poTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pembelian</span>
                  <span className="font-medium text-destructive">- {formatCurrency(totalPurchases)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Biaya Tambahan</span>
                  <span className="font-medium text-destructive">- {formatCurrency(totalAddCosts)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>{profit >= 0 ? 'Laba' : 'Rugi'}</span>
                  <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatCurrency(profit)}
                  </span>
                </div>
                {poTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Margin</span>
                    <span>{((profit / poTotal) * 100).toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Catatan Progres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Tambah catatan progres..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={submittingNote || !noteContent.trim()}
                  className="self-end"
                >
                  {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tambah'}
                </Button>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {(project.progressNotes || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada catatan</p>
                  ) : (
                    project.progressNotes.map((note: any) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {note.createdBy || 'Staff'} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: RAB ─── */}
        <TabsContent value="rab" className="space-y-6 mt-4">
          {/* Items with purchases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Item RAB & Pembelian</CardTitle>
              <CardDescription>Lacak biaya pembelian setiap item</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Harga Jual</TableHead>
                      <TableHead className="text-center">Deadline</TableHead>
                      <TableHead className="text-right">Total RAB</TableHead>
                      <TableHead className="text-right">Total Beli</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(project.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Tidak ada item dalam proyek ini
                        </TableCell>
                      </TableRow>
                    ) : (
                      project.items.map((item: any) => {
                        const itemBuyTotal = item.purchases?.reduce((s: number, p: any) => s + p.totalBuy, 0) || 0
                        const margin = item.total - itemBuyTotal
                        return (
                          <Fragment key={item.id}>
                            <TableRow>
                              <TableCell>
                                <div className="font-medium text-foreground text-sm">{item.itemName}</div>
                                <div className="text-[10px] text-muted-foreground">ID: {item.itemId} {item.itemCode ? `| Kode: ${item.itemCode}` : ''}</div>
                              </TableCell>
                              <TableCell className="text-right text-sm">{item.qty} {item.unit}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-center text-sm">{formatDate(item.deadline)}</TableCell>
                              <TableCell className="text-right text-sm font-medium">{formatCurrency(item.total)}</TableCell>
                              <TableCell className="text-right text-sm font-medium text-destructive">{formatCurrency(itemBuyTotal)}</TableCell>
                              <TableCell className={`text-right text-sm font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(margin)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedItemId(item.id)
                                    setPurchaseOpen(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Beli
                                </Button>
                              </TableCell>
                            </TableRow>
                            {/* Purchase details */}
                            {item.purchases?.length > 0 && (
                              <TableRow key={`${item.id}-purchases`} className="bg-muted/20">
                                <TableCell colSpan={8} className="p-2">
                                  <div className="pl-6 space-y-1">
                                    {item.purchases.map((p: any) => (
                                      <div key={p.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50 last:border-0">
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${p.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                          {p.status === 'SUCCESS' ? 'LUNAS' : 'REQUEST'}
                                        </Badge>
                                        <span className="text-muted-foreground">{p.vendor?.name || 'Tanpa vendor'}</span>
                                        <span className="text-muted-foreground">× {p.qty} @ {formatCurrency(p.buyPrice)}</span>
                                        <span className="font-medium text-foreground">= {formatCurrency(p.totalBuy)}</span>
                                        
                                        {/* Actions & Links */}
                                        <div className="flex items-center gap-2 ml-auto">
                                          {p.docUrl && (
                                            <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                              [Inv/Referensi]
                                            </a>
                                          )}
                                          {p.paymentProofUrl && (
                                            <a href={p.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                                              [Bukti Transfer]
                                            </a>
                                          )}
                                          {p.status === 'REQUEST' && (
                                            <Button size="sm" className="h-6 text-[10px] px-2 ml-2" onClick={() => {
                                              setSelectedPurchaseId(p.id)
                                              setPayOpen(true)
                                            }}>
                                              Konfirmasi Bayar
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Biaya Tambahan</CardTitle>
                  <CardDescription>Aksesoris, pengiriman, operasional, dll.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAddCostOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Tambah Biaya
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.additionalCosts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada biaya tambahan</p>
              ) : (
                <div className="space-y-2">
                  {project.additionalCosts.map((cost: any) => (
                    <div key={cost.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cost.category}</Badge>
                          <span className="text-sm font-medium text-foreground">{cost.description}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(cost.date)}</span>
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
                      <span className="text-sm font-medium text-destructive">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Total Biaya Tambahan</span>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(totalAddCosts)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RAB Purchase Dialog */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Pembelian</DialogTitle>
                <DialogDescription>Catat pembelian untuk item ini</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPurchase} className="space-y-4 mt-2">
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

                {vendorType === 'EXISTING' ? (
                  <div className="space-y-2">
                    <Label>Vendor</Label>
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
                    <Label>Nama Vendor Baru</Label>
                    <Input value={purchaseForm.vendorName} onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })} placeholder="Ketik nama vendor" required />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qty</Label>
                    <Input type="number" min="0" step="any" value={purchaseForm.qty} onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga Beli (Satuan)</Label>
                    <Input type="number" min="0" step="any" value={purchaseForm.buyPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Upload Proforma Invoice / Referensi (Opsional)</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setPurchaseDocFile(e.target.files?.[0] || null)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Upload nota dari seller sebagai referensi harga / tagihan.</p>
                </div>
                <div className="space-y-2">
                  <Label>Catatan (No Rekening / Info Pembayaran)</Label>
                  <Textarea value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="Masukkan nomor rekening atau catatan transfer jika tidak ada invoice..." rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPurchaseOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submittingPurchase}>
                    {submittingPurchase ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Ajukan Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* RAB Pay Dialog */}
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                <DialogDescription>Konfirmasi pelunasan request pembelian ini</DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePayPurchase} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Upload Bukti Transfer</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setPayProofFile(e.target.files?.[0] || null)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Struk resi transfer dari bank / e-wallet.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={submittingPay}>
                    {submittingPay ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Konfirmasi & Lunas'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Additional Cost Dialog */}
          <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
            <DialogContent className="sm:max-w-md">
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
                    <Label>Jumlah *</Label>
                    <Input type="number" min="0" value={addCostForm.amount} onChange={(e) => setAddCostForm({ ...addCostForm, amount: e.target.value })} required />
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
                    {submittingCost ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Tambah Biaya
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── TAB: DOCUMENTS ─── */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Surat Jalan */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Surat Jalan</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSjFormOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />Buat
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
                  <Plus className="w-3 h-3 mr-1" />Buat
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
                  <Plus className="w-3 h-3 mr-1" />Buat
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
                  <Plus className="w-3 h-3 mr-1" />Buat
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
        </>
      )}
    </div>
  )
}
