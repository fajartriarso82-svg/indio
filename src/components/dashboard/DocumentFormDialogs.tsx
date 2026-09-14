'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/hooks/use-toast'

/* ═══════════ Shared Types ═══════════ */

interface ItemRef {
  id: string
  itemName: string
  qty: number
  unit: string
  unitPrice: number
  total: number
  itemId: string
  itemCode: string
}

interface DocItem {
  itemId?: string
  itemCode?: string
  description: string
  qty: string
  unit: string
  notes: string
}

interface AmountItem {
  description: string
  amount: string
  notes: string
}

interface TerminItem {
  terminNo: number
  percentage: string
  amount: string
  dueDate: string
  notes: string
}

/* ═══════════ SURAT JALAN FORM ═══════════ */

interface SuratJalanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectType: string
  projectItems: ItemRef[]
  onCreated: () => void
}

export function SuratJalanForm({ open, onOpenChange, projectId, projectType, projectItems, onCreated }: SuratJalanFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [sjNumber, setSjNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [items, setItems] = useState<DocItem[]>([{ description: '', qty: '1', unit: 'pcs', notes: '' }])

  const addItem = () => setItems([...items, { description: '', qty: '1', unit: 'pcs', notes: '' }])
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }
  const updateItem = (i: number, field: keyof DocItem, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const selectProjectItem = (projectItemId: string) => {
    const item = projectItems.find((i) => i.id === projectItemId)
    if (item) {
      setItems([...items, {
        itemId: item.itemId,
        itemCode: item.itemCode,
        description: item.itemName,
        qty: item.qty.toString(),
        unit: item.unit,
        notes: '',
      }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) {
      toast({ title: 'Validasi', description: 'Tanggal wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/surat-jalan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sjNumber, date, type: projectType, notes,
          vehicle, plateNumber, driverName,
          items: items.filter((i) => i.description.trim()),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Surat Jalan Dibuat' })
        onOpenChange(false)
        setSjNumber('')
        setNotes('')
        setVehicle('')
        setPlateNumber('')
        setDriverName('')
        setItems([{ description: '', qty: '1', unit: 'pcs', notes: '' }])
        onCreated()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Surat Jalan</DialogTitle>
          <DialogDescription>Tambah surat jalan untuk proyek ini</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor SJ (Otomatis jika kosong)</Label>
              <Input value={sjNumber} onChange={(e) => setSjNumber(e.target.value)} placeholder="Auto-generate" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kendaraan</Label>
              <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Mis. Mobil Pickup" />
            </div>
            <div className="space-y-2">
              <Label>Plat Nomor</Label>
              <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="B 1234 CD" />
            </div>
            <div className="space-y-2">
              <Label>Nama Pengemudi</Label>
              <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Pengemudi" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pilih dari item proyek</Label>
            <Select onValueChange={selectProjectItem}>
              <SelectTrigger><SelectValue placeholder="Tambah item dari proyek..." /></SelectTrigger>
              <SelectContent>
                {projectItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.itemName} ({item.qty} {item.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />Tambah
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Deskripsi</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Item" className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                  <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Satuan</Label>}
                  <Input value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Catatan</Label>}
                  <Input value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="h-6 w-6 p-0 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional" rows={2} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════ BAST FORM ═══════════ */

interface BASTFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectType: string
  suratJalans: any[]
  onCreated: () => void
}

export function BASTForm({ open, onOpenChange, projectId, projectType, suratJalans, onCreated }: BASTFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [bastNumber, setBastNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<DocItem[]>([{ description: '', qty: '1', unit: 'pcs', notes: '' }])

  const addItem = () => setItems([...items, { description: '', qty: '1', unit: 'pcs', notes: '' }])
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }
  const updateItem = (i: number, field: keyof DocItem, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const selectSuratJalan = (sjId: string) => {
    const sj = suratJalans.find((s) => s.id === sjId)
    if (sj?.items?.length) {
      const newItems = sj.items.map((i: any) => ({
        description: i.description || '',
        qty: i.qty?.toString() || '1',
        unit: i.unit || 'pcs',
        notes: i.notes || '',
      }))
      setItems(newItems)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bastNumber || !date) {
      toast({ title: 'Validasi', description: 'Nomor BAST dan tanggal wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/bast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bastNumber, date, type: projectType, notes,
          items: items.filter((i) => i.description.trim()),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'BAST Dibuat' })
        onOpenChange(false)
        setBastNumber('')
        setNotes('')
        setItems([{ description: '', qty: '1', unit: 'pcs', notes: '' }])
        onCreated()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat BAST</DialogTitle>
          <DialogDescription>Tambah dokumen serah terima untuk proyek ini</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor BAST *</Label>
              <Input value={bastNumber} onChange={(e) => setBastNumber(e.target.value)} placeholder="BAST-2024-001" required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {suratJalans.length > 0 && (
            <div className="space-y-2">
              <Label>Impor dari Surat Jalan</Label>
              <Select onValueChange={selectSuratJalan}>
                <SelectTrigger><SelectValue placeholder="Pilih Surat Jalan..." /></SelectTrigger>
                <SelectContent>
                  {suratJalans.map((sj) => (
                    <SelectItem key={sj.id} value={sj.id}>{sj.sjNumber} ({formatDate(sj.date)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />Tambah
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Deskripsi</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Item" className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                  <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Satuan</Label>}
                  <Input value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Catatan</Label>}
                  <Input value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="h-6 w-6 p-0 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional" rows={2} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════ INVOICE FORM ═══════════ */

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectItems: ItemRef[]
  onCreated: () => void
}

export function InvoiceForm({ open, onOpenChange, projectId, projectItems, onCreated }: InvoiceFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<AmountItem[]>([{ description: '', amount: '0', notes: '' }])
  const [termins, setTermins] = useState<TerminItem[]>([])

  const addItem = () => setItems([...items, { description: '', amount: '0', notes: '' }])
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }
  const updateItem = (i: number, field: keyof AmountItem, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const addTermin = () => setTermins([...termins, { terminNo: termins.length + 1, percentage: '', amount: '', dueDate: '', notes: '' }])
  const removeTermin = (i: number) => setTermins(termins.filter((_, idx) => idx !== i))
  const updateTermin = (i: number, field: keyof TerminItem, value: string) => {
    const updated = [...termins]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'terminNo') updated[i].terminNo = parseInt(value) || 0
    setTermins(updated)
  }

  const selectProjectItem = (itemId: string) => {
    const item = projectItems.find((i) => i.id === itemId)
    if (item) {
      setItems([...items, {
        description: item.itemName,
        amount: item.total.toString(),
        notes: '',
      }])
    }
  }

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber || !date || !paymentMethod) {
      toast({ title: 'Validasi', description: 'Nomor invoice, tanggal, dan metode pembayaran wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const body: any = {
        invoiceNumber, date, dueDate: dueDate || null, paymentMethod, notes,
        items: items.filter((i) => i.description.trim()).map((i) => ({
          description: i.description,
          amount: parseFloat(i.amount) || 0,
          notes: i.notes || null,
        })),
      }

      if (paymentMethod === 'TERMIN' && termins.length > 0) {
        body.termins = termins.map((t) => ({
          terminNo: t.terminNo,
          percentage: parseFloat(t.percentage) || 0,
          amount: parseFloat(t.amount) || 0,
          dueDate: t.dueDate || null,
          notes: t.notes || null,
        }))
      }

      const res = await fetch(`/api/projects/${projectId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Invoice Dibuat' })
        onOpenChange(false)
        setInvoiceNumber('')
        setDueDate('')
        setNotes('')
        setPaymentMethod('CASH')
        setItems([{ description: '', amount: '0', notes: '' }])
        setTermins([])
        onCreated()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Invoice</DialogTitle>
          <DialogDescription>Tambah invoice untuk proyek ini</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Invoice *</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-2024-001" required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai</SelectItem>
                  <SelectItem value="TEMPO">Tempo</SelectItem>
                  <SelectItem value="TERMIN">Termin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pilih dari item proyek</Label>
            <Select onValueChange={selectProjectItem}>
              <SelectTrigger><SelectValue placeholder="Tambah item dari proyek..." /></SelectTrigger>
              <SelectContent>
                {projectItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.itemName} ({formatCurrency(item.total)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />Tambah
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Deskripsi</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Item" className="h-8 text-xs" />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Jumlah</Label>}
                  <Input type="number" value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Catatan</Label>}
                  <Input value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="h-6 w-6 p-0 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="text-right text-sm font-medium">
              Total: {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Termin Schedule */}
          {paymentMethod === 'TERMIN' && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Jadwal Termin</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTermin}>
                  <Plus className="w-3 h-3 mr-1" />Tambah Termin
                </Button>
              </div>
              {termins.map((t, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-1">
                    <Input value={t.terminNo.toString()} onChange={(e) => updateTermin(idx, 'terminNo', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <Input value={t.percentage} onChange={(e) => updateTermin(idx, 'percentage', e.target.value)} placeholder="%" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" value={t.amount} onChange={(e) => updateTermin(idx, 'amount', e.target.value)} placeholder="Amount" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-3">
                    <Input type="date" value={t.dueDate} onChange={(e) => updateTermin(idx, 'dueDate', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <Input value={t.notes} onChange={(e) => updateTermin(idx, 'notes', e.target.value)} placeholder="Notes" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTermin(idx)} className="h-6 w-6 p-0 text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional" rows={2} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════ KUITANSI FORM ═══════════ */

interface KuitansiFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  invoices: any[]
  basts: any[]
  onCreated: () => void
}

export function KuitansiForm({ open, onOpenChange, projectId, invoices, basts, onCreated }: KuitansiFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [kuitansiNumber, setKuitansiNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [invoiceId, setInvoiceId] = useState('')
  const [bastId, setBastId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<AmountItem[]>([{ description: '', amount: '0', notes: '' }])

  const addItem = () => setItems([...items, { description: '', amount: '0', notes: '' }])
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }
  const updateItem = (i: number, field: keyof AmountItem, value: string) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const handleInvoiceSelect = (id: string) => {
    setInvoiceId(id)
    const inv = invoices.find((i) => i.id === id)
    if (inv) {
      const total = inv.items?.reduce((s: number, i: any) => s + i.amount, 0) || 0
      setAmount(total.toString())
      setItems(inv.items?.map((i: any) => ({
        description: i.description,
        amount: i.amount.toString(),
        notes: i.notes || '',
      })) || [{ description: '', amount: '0', notes: '' }])
    }
  }

  const handleBastSelect = (id: string) => {
    setBastId(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kuitansiNumber || !date || !paymentMethod) {
      toast({ title: 'Validasi', description: 'Nomor kuitansi, tanggal, dan metode pembayaran wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/kuitansi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kuitansiNumber, date, amount: parseFloat(amount) || 0,
          paymentMethod, invoiceId: invoiceId || null, bastId: bastId || null,
          notes,
          items: items.filter((i) => i.description.trim()).map((i) => ({
            description: i.description,
            amount: parseFloat(i.amount) || 0,
            notes: i.notes || null,
          })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Kuitansi Dibuat' })
        onOpenChange(false)
        setKuitansiNumber('')
        setAmount('0')
        setNotes('')
        setPaymentMethod('CASH')
        setInvoiceId('')
        setBastId('')
        setItems([{ description: '', amount: '0', notes: '' }])
        onCreated()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Kuitansi</DialogTitle>
          <DialogDescription>Tambah kuitansi untuk proyek ini</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Kuitansi *</Label>
              <Input value={kuitansiNumber} onChange={(e) => setKuitansiNumber(e.target.value)} placeholder="KWT-2024-001" required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jumlah *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" required />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="TEMPO">Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Tautkan ke Invoice</Label>
                <Select value={invoiceId} onValueChange={handleInvoiceSelect}>
                  <SelectTrigger><SelectValue placeholder="Pilih invoice..." /></SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {basts.length > 0 && (
              <div className="space-y-2">
                <Label>Tautkan ke BAST</Label>
                <Select value={bastId} onValueChange={handleBastSelect}>
                  <SelectTrigger><SelectValue placeholder="Pilih BAST..." /></SelectTrigger>
                  <SelectContent>
                    {basts.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.bastNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />Tambah
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Deskripsi</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Item" className="h-8 text-xs" />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Jumlah</Label>}
                  <Input type="number" value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label className="text-[10px] text-muted-foreground">Catatan</Label>}
                  <Input value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="h-6 w-6 p-0 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional" rows={2} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════ Helpers ═══════════ */

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
