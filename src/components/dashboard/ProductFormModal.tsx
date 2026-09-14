'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const CATEGORIES: Record<string, string[]> = {
  'Komputer & Perangkat Cerdas': [
    'Laptop (Consumer, Gaming, Business)',
    'Desktop PC (Branded, Custom Build, All-in-One, Mini PC)',
    'Server & Workstation'
  ],
  'Komponen PC (Hardware Internal)': [
    'Prosesor (CPU)',
    'Motherboard',
    'Kartu Grafis (VGA/GPU)',
    'Memori (RAM)',
    'Penyimpanan Internal (SSD, HDD, NVMe)',
    'Power Supply (PSU)',
    'Casing PC',
    'Sistem Pendingin (Cooler, Fan, Thermal Paste)'
  ],
  'Periferal & Aksesoris': [
    'Monitor & Proyektor',
    'Smart TV & Commercial Display',
    'Keyboard, Mouse & Mousepad',
    'Audio IT (Headset, Speaker, Mikrofon)',
    'Media Penyimpanan Eksternal (Flashdisk, HDD/SSD Eksternal)',
    'Kabel, Adaptor & Konverter',
    'UPS & Stabilizer',
    'Webcam & Aksesoris Meja (Monitor Arm, dll)'
  ],
  'Jaringan & Keamanan (Networking)': [
    'Router & Access Point',
    'Switch & Hub',
    'Kabel Jaringan & Konektor (UTP, Fiber, RJ45)',
    'Rack Server & Aksesoris',
    'CCTV, IP Camera & NVR/DVR'
  ],
  'Printer & Scanner': [
    'Printer (Inkjet, Laser, Dot Matrix)',
    'Scanner (Document & Flatbed)',
    'Tinta, Toner, Cartridge & Pita (Bahan Habis Pakai / Consumables)'
  ],
  'Perangkat Lunak (Software & Lisensi)': [
    'Sistem Operasi (OS)',
    'Keamanan (Antivirus, Firewall)',
    'Produktivitas & Office',
    'Desain & Multimedia'
  ],
  'Layanan & Jasa IT': [
    'Perakitan & Instalasi (Hardware & Jaringan)',
    'Perbaikan & Pemeliharaan (Maintenance / Servis)',
    'Konsultasi & Pengembangan Sistem'
  ],
  'Smartphone, Tablet & Gadget': [
    'Smartphone (Android/iOS)',
    'Tablet & E-Reader',
    'Smartwatch & Wearables',
    'Aksesoris Gadget (Charger, Case, Powerbank)'
  ],
  'Fotografi, Videografi & Drone': [
    'Kamera (Mirrorless, DSLR, Pocket, Action Cam)',
    'Lensa Kamera',
    'Drone & Aksesoris',
    'Peralatan Studio (Lighting, Gimbal, Tripod, Microphone Studio)'
  ],
  'Smart Home & IoT': [
    'Smart Lighting (Lampu Pintar)',
    'Smart Security (Door Lock, Sensor Alarm)',
    'Smart Plug & Controller IR',
    'Voice Assistant & Smart Speaker'
  ],
  'Suku Cadang & Peralatan Servis': [
    'Suku Cadang Komputer & Laptop',
    'Suku Cadang Printer',
    'Suku Cadang Gadget & Jaringan',
    'Peralatan Servis'
  ],
  'Gaming & E-Sports': [
    'Konsol Game (PlayStation, Xbox, Nintendo)',
    'Handheld Console (Steam Deck, ROG Ally)',
    'VR & AR Headset',
    'Aksesoris Gaming Spesifik'
  ],
  'Sistem Kasir & Ritel (Point of Sale / POS)': [
    'Mesin Kasir & Komputer POS',
    'Barcode Scanner (1D/2D)',
    'Printer Kasir & Struk',
    'Cash Drawer & Customer Display'
  ],
  'Peralatan Kantor Elektronik (Office Equipment)': [
    'Sistem Absensi & Akses',
    'Mesin Penghancur Kertas',
    'Papan Tulis Interaktif',
    'Mesin Hitung Uang & Kalkulator Print'
  ],
  '3D Printing & Maker': [
    'Mesin 3D Printer (FDM & Resin)',
    'Bahan Baku (Filament, Cairan Resin)',
    'Single Board Computer & Mikrokontroler',
    'Modul Sensor & Part Robotika Edukasi'
  ],
  'Lainnya': [
    'Merchandise & Apparel Resmi Brand IT',
    'Furnitur Khusus IT (Meja Setup PC, Kursi Ergonomis/Gaming)'
  ]
}

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: any // For edit mode later
}

export function ProductFormModal({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    category: '',
    subCategory: '',
    name: '',
    spec: '',
    qty: 0,
    sellPrice: 0,
    costPrice: 0,
    retailPrice: 0,
    warranty: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        productId: product.productId || '',
        category: product.category || '',
        subCategory: product.subCategory || '',
        name: product.name || '',
        spec: product.spec || '',
        qty: product.qty || 0,
        sellPrice: product.sellPrice || 0,
        costPrice: product.costPrice || 0,
        retailPrice: product.retailPrice || 0,
        warranty: product.warranty || ''
      })
    } else {
      setFormData({
        productId: '',
        category: '',
        subCategory: '',
        name: '',
        spec: '',
        qty: 0,
        sellPrice: 0,
        costPrice: 0,
        retailPrice: 0,
        warranty: ''
      })
    }
  }, [product, isOpen])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'category') {
        next.subCategory = '' // Reset subcategory when category changes
      }
      return next
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
      } else {
        alert(data.error || 'Failed to save product')
      }
    } catch (error) {
      console.error(error)
      alert('Error saving product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Nomor / ID Barang</Label>
            <Input 
              value={formData.productId} 
              onChange={e => handleChange('productId', e.target.value)}
              placeholder="Contoh: LAP-001"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Nama Barang</Label>
            <Input 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Contoh: Asus ROG Strix"
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select 
              value={formData.category} 
              onValueChange={val => handleChange('category', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORIES).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sub Kategori</Label>
            <Select 
              value={formData.subCategory} 
              onValueChange={val => handleChange('subCategory', val)}
              disabled={!formData.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Sub Kategori" />
              </SelectTrigger>
              <SelectContent>
                {formData.category && CATEGORIES[formData.category]?.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Spesifikasi</Label>
            <Input 
              value={formData.spec} 
              onChange={e => handleChange('spec', e.target.value)}
              placeholder="RAM 16GB, SSD 512GB, RTX 3050"
            />
          </div>

          <div className="space-y-2">
            <Label>Stok (Qty)</Label>
            <Input 
              type="number"
              value={formData.qty || ''} 
              onChange={e => handleChange('qty', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Garansi</Label>
            <Input 
              value={formData.warranty} 
              onChange={e => handleChange('warranty', e.target.value)}
              placeholder="1 Tahun Resmi"
            />
          </div>

          <div className="space-y-2">
            <Label>Harga Pokok (Rp)</Label>
            <Input 
              type="number"
              value={formData.costPrice || ''} 
              onChange={e => handleChange('costPrice', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Harga Jual (Rp)</Label>
            <Input 
              type="number"
              value={formData.sellPrice || ''} 
              onChange={e => handleChange('sellPrice', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Harga Eceran (Rp)</Label>
            <Input 
              type="number"
              value={formData.retailPrice || ''} 
              onChange={e => handleChange('retailPrice', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
            {loading ? 'Menyimpan...' : 'Simpan Barang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
