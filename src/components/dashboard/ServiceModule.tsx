'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FileDown, Eye, Loader2, Wrench, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ServiceFormModal from './ServiceFormModal'
import ServiceDetailModal from './ServiceDetailModal'
import * as XLSX from 'xlsx'

interface Service {
  id: string
  serviceId: string
  date: string
  clientName: string | null
  itemName: string
  complaint: string
  status: string
  totalCost: number
  clientPhone?: string | null
  brand?: string | null
  modelType?: string | null
  serialNumber?: string | null
  completeness?: string | null
  photoUrl?: string | null
  sparepartCost?: number
  serviceFee?: number
  shippingCost?: number
  sparepartDetails?: string | null
  actions?: any[]
}

export default function ServiceModule() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      if (data.success) {
        setServices(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data service ini?')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchServices()
      } else {
        alert(data.error || 'Gagal menghapus data')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan')
    }
  }

  const handleExportExcel = () => {
    if (services.length === 0) {
      alert('Tidak ada data service untuk di-export.')
      return
    }

    const exportData = services.map((s) => ({
      'ID Service': s.serviceId,
      'Tanggal': format(new Date(s.date), 'dd MMM yyyy, HH:mm', { locale: id }),
      'Pelanggan': s.clientName || 'Pelanggan Umum',
      'No HP': s.clientPhone || '-',
      'Barang': s.itemName,
      'Merek': s.brand || '-',
      'Model': s.modelType || '-',
      'Keluhan': s.complaint,
      'Status': s.status,
      'Biaya Sparepart': s.sparepartCost || 0,
      'Biaya Jasa': s.serviceFee || 0,
      'Ongkir': s.shippingCost || 0,
      'Total Biaya': s.totalCost || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Data_Service_Z-Indio_${dateStr}.xlsx`)
  }

  const filteredServices = services.filter(
    (s) =>
      s.serviceId.toLowerCase().includes(search.toLowerCase()) ||
      (s.clientName && s.clientName.toLowerCase().includes(search.toLowerCase())) ||
      s.itemName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">POS Service</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola penerimaan service, status perbaikan, dan tindakan teknisi.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExportExcel}>
            <FileDown className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Terima Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Service</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ID, Pelanggan, atau Barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4">
              <Wrench className="w-8 h-8 mb-2 text-muted-foreground/50" />
              <p className="font-medium text-foreground">Belum ada data service</p>
              <p className="text-sm">Klik 'Terima Service' untuk menambah data.</p>
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {filteredServices.map((svc) => (
                  <div key={svc.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{svc.serviceId}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(svc.date), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${
                          svc.status === 'SELESAI' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          svc.status === 'PROSES' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          svc.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          svc.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-purple-50 text-purple-600 border-purple-200'
                        }`}
                      >
                        {svc.status}
                      </Badge>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Pelanggan</p>
                      <p className="text-sm truncate">{svc.clientName || 'Pelanggan Umum'}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Barang</p>
                      <p className="text-sm font-medium truncate">{svc.itemName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{svc.complaint}</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setSelectedService(svc)
                          setDetailModalOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(svc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== DESKTOP: Tabel ===== */}
              <div className="hidden md:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[120px]">ID Service</TableHead>
                        <TableHead className="min-w-[140px]">Tanggal</TableHead>
                        <TableHead className="min-w-[140px]">Pelanggan</TableHead>
                        <TableHead className="min-w-[200px]">Barang & Keluhan</TableHead>
                        <TableHead className="text-center min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[80px] text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((svc) => (
                        <TableRow key={svc.id}>
                          <TableCell className="font-medium">{svc.serviceId}</TableCell>
                          <TableCell>
                            {format(new Date(svc.date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>{svc.clientName || 'Pelanggan Umum'}</TableCell>
                          <TableCell>
                            <div className="font-medium">{svc.itemName}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{svc.complaint}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                svc.status === 'SELESAI' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                svc.status === 'PROSES' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                svc.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                svc.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                'bg-purple-50 text-purple-600 border-purple-200'
                              }
                            >
                              {svc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500"
                                onClick={() => {
                                  setSelectedService(svc)
                                  setDetailModalOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:bg-rose-100"
                                onClick={() => handleDelete(svc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ServiceFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchServices}
      />

      <ServiceDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        service={selectedService as any}
        onSuccess={fetchServices}
      />
    </div>
  )
}
