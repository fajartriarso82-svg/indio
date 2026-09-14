'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ServiceFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ServiceFormModal({ open, onOpenChange, onSuccess }: ServiceFormModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Form States
  const [clientType, setClientType] = useState<'new'|'registered'>('registered')
  const [clients, setClients] = useState<any[]>([])
  
  const [client, setClient] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  const [itemName, setItemName] = useState('')
  const [brand, setBrand] = useState('')
  const [modelType, setModelType] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [completeness, setCompleteness] = useState('')
  const [complaint, setComplaint] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClients(data.data)
        }
      })
      .catch(console.error)
  }, [])

  const resetForm = () => {
    setClientType('registered')
    setClient({ id: '', name: '', phone: '', email: '', address: '' })
    setItemName('')
    setBrand('')
    setModelType('')
    setSerialNumber('')
    setCompleteness('')
    setComplaint('')
    setPhotoFile(null)
  }

  const handleSaveClient = async () => {
    if (!client.name) return alert("Nama pelanggan wajib diisi")
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
      let photoUrl = null

      if (photoFile) {
        const formData = new FormData()
        formData.append('file', photoFile)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          photoUrl = uploadData.url
        } else {
          alert('Gagal mengupload foto barang')
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientType,
          client,
          itemName,
          brand,
          modelType,
          serialNumber,
          completeness,
          complaint,
          photoUrl
        })
      })
      
      const data = await res.json()
      if (data.success) {
        resetForm()
        onSuccess()
        onOpenChange(false)
      } else {
        alert(data.error || 'Gagal menyimpan data service')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Terima Service Baru</DialogTitle>
          <DialogDescription>
            Masukkan data pelanggan dan rincian barang yang akan diservice.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Informasi Pelanggan */}
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
                      <Label>Nama Lengkap <span className="text-rose-500">*</span></Label>
                      <Input
                        value={client.name}
                        onChange={(e) => setClient({ ...client, name: e.target.value })}
                        placeholder="Nama pelanggan"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP / WhatsApp</Label>
                      <Input
                        value={client.phone}
                        onChange={(e) => setClient({ ...client, phone: e.target.value })}
                        placeholder="08..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Alamat Lengkap</Label>
                      <Input
                        value={client.address}
                        onChange={(e) => setClient({ ...client, address: e.target.value })}
                        placeholder="Alamat pelanggan"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informasi Barang */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Barang</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Barang / Perangkat <span className="text-rose-500">*</span></Label>
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Contoh: Laptop Asus Vivobook / Printer Epson L3110"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Merek</Label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Contoh: Asus, Epson, dll"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Model / Tipe</Label>
                  <Input
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    placeholder="Contoh: A416MA"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Serial Number (SN)</Label>
                  <Input
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="SN Perangkat"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kelengkapan yang dibawa</Label>
                  <Input
                    value={completeness}
                    onChange={(e) => setCompleteness(e.target.value)}
                    placeholder="Contoh: Unit laptop, Charger, Tas"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Keluhan / Kerusakan <span className="text-rose-500">*</span></Label>
                  <Textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Jelaskan keluhan yang dialami pelanggan..."
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Foto Barang (Opsional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Unggah foto kondisi barang saat diterima.</p>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="service-form" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
            Simpan & Terima Service
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
