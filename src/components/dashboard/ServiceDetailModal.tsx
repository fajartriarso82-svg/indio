'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Printer, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ServiceAction {
  id: string
  technician: string | null
  action: string
  createdAt: string
}

interface Service {
  id: string
  serviceId: string
  date: string
  clientName: string | null
  clientPhone: string | null
  itemName: string
  brand: string | null
  modelType: string | null
  serialNumber: string | null
  completeness: string | null
  complaint: string
  photoUrl: string | null
  status: string
  sparepartCost: number
  serviceFee: number
  shippingCost: number
  totalCost: number
  sparepartDetails: string | null
  actions: ServiceAction[]
}

interface SparepartItem {
  name: string
  price: number
}

interface ServiceDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

export default function ServiceDetailModal({ open, onOpenChange, service, onSuccess }: ServiceDetailModalProps) {
  const [loading, setLoading] = useState(false)
  
  // States that mirror service data
  const [status, setStatus] = useState('PENDING')
  
  // Technician Log State
  const [newTechnician, setNewTechnician] = useState('')
  const [newAction, setNewAction] = useState('')

  // Cost States
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([])
  const [serviceFee, setServiceFee] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)

  useEffect(() => {
    if (service) {
      setStatus(service.status)
      setServiceFee(service.serviceFee || 0)
      setShippingCost(service.shippingCost || 0)
      
      if (service.sparepartDetails) {
        try {
          const parsed = JSON.parse(service.sparepartDetails)
          if (Array.isArray(parsed)) {
            setSpareparts(parsed)
          }
        } catch (e) {
          setSpareparts([])
        }
      } else {
        setSpareparts([])
      }

      setNewTechnician('')
      setNewAction('')
    }
  }, [service])

  if (!service) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddSparepart = () => {
    setSpareparts([...spareparts, { name: '', price: 0 }])
  }

  const handleUpdateSparepart = (index: number, field: keyof SparepartItem, value: any) => {
    const updated = [...spareparts]
    updated[index] = { ...updated[index], [field]: value }
    setSpareparts(updated)
  }

  const handleRemoveSparepart = (index: number) => {
    const updated = spareparts.filter((_, i) => i !== index)
    setSpareparts(updated)
  }

  const totalSparepartCost = spareparts.reduce((sum, sp) => sum + (Number(sp.price) || 0), 0)
  const grandTotal = totalSparepartCost + (Number(serviceFee) || 0) + (Number(shippingCost) || 0)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          technician: newTechnician,
          actionNote: newAction,
          sparepartDetails: JSON.stringify(spareparts),
          sparepartCost: totalSparepartCost,
          serviceFee: Number(serviceFee) || 0,
          shippingCost: Number(shippingCost) || 0,
          totalCost: grandTotal
        })
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
        alert('Data service berhasil diperbarui')
        setNewAction('') // Clear new action input after save
      } else {
        alert(data.error || 'Gagal menyimpan data')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'SELESAI': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
      case 'PROSES': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-200'
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-600 border-rose-200'
      case 'DIKIRIM_KE_SERVICE_CENTER': return 'bg-purple-500/10 text-purple-600 border-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">Detail Service</DialogTitle>
              <DialogDescription className="mt-1 font-medium text-foreground">
                {service.serviceId} &bull; {format(new Date(service.date), 'dd MMMM yyyy', { locale: id })}
              </DialogDescription>
            </div>
            <Badge variant="outline" className={`px-3 py-1 text-xs ${getStatusColor(service.status)}`}>
              {service.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Info Kiri */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Informasi Pelanggan
                </h4>
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="font-medium text-lg">{service.clientName}</p>
                  {service.clientPhone && <p className="text-sm text-muted-foreground">{service.clientPhone}</p>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Detail Perangkat
                </h4>
                <div className="bg-muted/30 p-3 rounded-md space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Barang</p>
                    <p className="font-medium">{service.itemName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Merek</p>
                      <p className="text-sm">{service.brand || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Model/Tipe</p>
                      <p className="text-sm">{service.modelType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Serial Number</p>
                      <p className="text-sm">{service.serialNumber || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kelengkapan</p>
                    <p className="text-sm">{service.completeness || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground text-rose-500 font-medium mt-2">Keluhan</p>
                    <p className="text-sm bg-rose-50 text-rose-700 p-2 rounded border border-rose-100">{service.complaint}</p>
                  </div>
                </div>
              </div>

              {service.photoUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Foto Perangkat
                  </h4>
                  <img src={service.photoUrl} alt="Foto Service" className="w-full max-w-[200px] rounded-md border" />
                </div>
              )}
            </div>

            {/* Aksi & Biaya Kanan */}
            <div className="space-y-6">
              
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Update Progres Service
                </h4>
                
                <div className="space-y-2">
                  <Label>Status Service</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">PENDING (Menunggu)</SelectItem>
                      <SelectItem value="PROSES">PROSES (Sedang Dikerjakan)</SelectItem>
                      <SelectItem value="DIKIRIM_KE_SERVICE_CENTER">KIRIM KE SERVICE CENTER</SelectItem>
                      <SelectItem value="SELESAI">SELESAI</SelectItem>
                      <SelectItem value="CANCELLED">BATAL / CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tambah Log Teknisi Baru</Label>
                  <Input 
                    placeholder="Nama Teknisi (Opsional)" 
                    value={newTechnician} 
                    onChange={e => setNewTechnician(e.target.value)} 
                    className="bg-white"
                  />
                  <Textarea 
                    placeholder="Catatan tindakan yang dilakukan..." 
                    value={newAction} 
                    onChange={e => setNewAction(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Rincian Biaya
                </h4>
                
                {/* Spareparts */}
                <div className="space-y-2 border p-3 rounded-md bg-muted/10">
                  <div className="flex justify-between items-center">
                    <Label>Daftar Sparepart</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSparepart} className="h-7 text-xs">
                      <Plus className="w-3 h-3" /> Tambah
                    </Button>
                  </div>
                  {spareparts.length === 0 && <p className="text-xs text-muted-foreground italic">Tidak ada sparepart.</p>}
                  {spareparts.map((sp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input 
                        placeholder="Nama part..." 
                        value={sp.name} 
                        onChange={e => handleUpdateSparepart(idx, 'name', e.target.value)}
                        className="flex-1 h-8"
                      />
                      <Input 
                        type="number" 
                        placeholder="Harga" 
                        value={sp.price || ''} 
                        onChange={e => handleUpdateSparepart(idx, 'price', Number(e.target.value))}
                        className="w-28 h-8"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleRemoveSparepart(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {spareparts.length > 0 && (
                    <div className="text-right text-sm text-muted-foreground pt-1">
                      Total Part: {formatCurrency(totalSparepartCost)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Biaya Jasa (Rp)</Label>
                    <Input 
                      type="number" 
                      value={serviceFee || ''} 
                      onChange={e => setServiceFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ongkos Kirim (Rp)</Label>
                    <Input 
                      type="number" 
                      value={shippingCost || ''} 
                      onChange={e => setShippingCost(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total Biaya</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Histori Tindakan (Full Width Bawah) */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Histori Tindakan Teknisi
            </h4>
            {service.actions && service.actions.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {service.actions.map((act) => (
                  <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900">{act.technician || 'Teknisi'}</div>
                        <time className="font-caveat font-medium text-indigo-500">{format(new Date(act.createdAt), 'dd/MM/yyyy HH:mm')}</time>
                      </div>
                      <div className="text-slate-500 text-sm whitespace-pre-wrap">{act.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded">Belum ada log tindakan.</p>
            )}
          </div>

        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-between bg-muted/20 items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => window.open(`/print/service/${service.id}/ticket`, '_blank')}
            >
              <Printer className="w-4 h-4" />
              Cetak Tiket
            </Button>
            <Button 
              variant="secondary" 
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
              onClick={() => window.open(`/print/service/${service.id}/invoice`, '_blank')}
            >
              <Printer className="w-4 h-4" />
              Cetak Ringkasan
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
