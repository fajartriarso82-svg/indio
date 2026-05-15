'use client'

import { useState, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

interface ClientOption {
  id: string
  name: string
  picName: string | null
  picEmail: string | null
  picPhone: string | null
  address: string | null
}

interface ItemRow {
  itemId: string
  itemName: string
  qty: string
  unit: string
  unitPrice: string
}

export default function ProjectForm({ open, onOpenChange, onCreated }: ProjectFormProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [type, setType] = useState('PENGADAAN')
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientPicName, setClientPicName] = useState('')
  const [clientPicEmail, setClientPicEmail] = useState('')
  const [clientPicPhone, setClientPicPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [internalPic, setInternalPic] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemRow[]>([
    { itemId: '', itemName: '', qty: '1', unit: 'pcs', unitPrice: '0' },
  ])

  useEffect(() => {
    if (open) {
      fetch('/api/clients')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setClients(data.data)
        })
        .catch(() => {})
    }
  }, [open])

  const handleClientChange = (id: string) => {
    setClientId(id)
    const client = clients.find((c) => c.id === id)
    if (client) {
      setClientPicName(client.picName || '')
      setClientPicEmail(client.picEmail || '')
      setClientPicPhone(client.picPhone || '')
      setClientAddress(client.address || '')
    }
  }

  const addItemRow = () => {
    setItems([...items, { itemId: '', itemName: '', qty: '1', unit: 'pcs', unitPrice: '0' }])
  }

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const getItemTotal = (item: ItemRow) => {
    const qty = parseFloat(item.qty) || 0
    const price = parseFloat(item.unitPrice) || 0
    return qty * price
  }

  const getGrandTotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const resetForm = () => {
    setType('PENGADAAN')
    setName('')
    setClientId('')
    setClientPicName('')
    setClientPicEmail('')
    setClientPicPhone('')
    setClientAddress('')
    setPoNumber('')
    setInternalPic('')
    setNotes('')
    setItems([{ itemId: '', itemName: '', qty: '1', unit: 'pcs', unitPrice: '0' }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !clientId) {
      toast({
        title: 'Kesalahan Validasi',
        description: 'Nama proyek dan klien wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const validItems = items.filter((item) => item.itemName.trim())
    if (validItems.length === 0) {
      toast({
        title: 'Kesalahan Validasi',
        description: 'Minimal satu item wajib diisi',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          clientId,
          clientPicName,
          clientPicEmail,
          clientPicPhone,
          clientAddress,
          poNumber,
          internalPic,
          notes,
          items: validItems.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            qty: parseFloat(item.qty) || 0,
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice) || 0,
          })),
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Proyek Dibuat',
          description: `${name} telah berhasil dibuat.`,
        })
        resetForm()
        onCreated()
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal membuat proyek', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Kesalahan jaringan', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Proyek Baru</DialogTitle>
          <DialogDescription>
            Tambah proyek baru dengan item RAB
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Project Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Tipe Proyek *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="projectType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENGADAAN">PENGADAAN (Pengadaan)</SelectItem>
                  <SelectItem value="JASA">JASA (Jasa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Nama Proyek *</Label>
              <Input
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama proyek"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Klien *</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Pilih klien" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poNumber">Nomor PO</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Nomor purchase order"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalPic">PIC Internal</Label>
              <Input
                id="internalPic"
                value={internalPic}
                onChange={(e) => setInternalPic(e.target.value)}
                placeholder="Penanggung jawab internal"
              />
            </div>
          </div>

          {/* Client PIC Info */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-3">PIC Klien (otomatis dari data klien)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpName">Nama PIC</Label>
                <Input
                  id="cpName"
                  value={clientPicName}
                  onChange={(e) => setClientPicName(e.target.value)}
                  placeholder="Nama penanggung jawab"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpEmail">Email PIC</Label>
                <Input
                  id="cpEmail"
                  value={clientPicEmail}
                  onChange={(e) => setClientPicEmail(e.target.value)}
                  placeholder="PIC email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpPhone">Telepon PIC</Label>
                <Input
                  id="cpPhone"
                  value={clientPicPhone}
                  onChange={(e) => setClientPicPhone(e.target.value)}
                  placeholder="PIC phone"
                />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor="cAddress">Alamat Pengiriman</Label>
              <Input
                id="cAddress"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Alamat pengiriman"
              />
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Item RAB</p>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Item
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">ID Item</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Nama Item *</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs w-20">Qty</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs w-20">Satuan</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs w-32">Harga Satuan</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs w-32">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        <Input
                          value={item.itemId}
                          onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                          placeholder="ID"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                          placeholder="Item name"
                          className="h-8 text-xs"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          className="h-8 text-xs text-right"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="pcs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="h-8 text-xs text-right"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs text-foreground">
                        {formatCurrency(getItemTotal(item))}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/30">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right font-medium text-sm">
                      Total Keseluruhan:
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-sm text-primary">
                      {formatCurrency(getGrandTotal())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan proyek"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</>
              ) : (
                'Buat Proyek'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
