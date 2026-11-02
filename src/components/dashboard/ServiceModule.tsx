'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  FileDown,
  Eye,
  Loader2,
  Wrench,
  Trash2,
  Wallet,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  actions?: unknown[]
}

type SvcTab = 'ALL' | 'PROSES' | 'PENDING' | 'SELESAI' | 'CANCELLED'

export default function ServiceModule() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<SvcTab>('ALL')
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

  const handleDelete = async (svcId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data service ini?')) return
    try {
      const res = await fetch(`/api/services/${svcId}`, { method: 'DELETE' })
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
      'Total Biaya': s.totalCost || 0,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Data_Service_Z-Indio_${dateStr}.xlsx`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400'
      case 'PROSES':
        return 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]'
      case 'PENDING':
        return 'bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400'
      case 'CANCELLED':
        return 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const kpi = useMemo(() => {
    const total = services.length
    const completed = services.filter((s) => s.status === 'SELESAI')
    const revenue = completed.reduce((acc, s) => acc + (s.totalCost || 0), 0)
    const active = services.filter((s) => s.status === 'PROSES' || s.status === 'PENDING').length
    return {
      total,
      completedCount: completed.length,
      revenue,
      active,
    }
  }, [services])

  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        if (activeTab !== 'ALL' && s.status !== activeTab) return false
        const q = search.toLowerCase()
        return (
          !q ||
          s.serviceId.toLowerCase().includes(q) ||
          (s.clientName && s.clientName.toLowerCase().includes(q)) ||
          s.itemName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
  }, [services, activeTab, search, sortOrder])

  return (
    <div className="space-y-6">
      {/* ===== KUSALE 3 KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Total Tiket Service</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.total}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              {kpi.completedCount} Selesai ▲
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#E6F8F3] dark:bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Pendapatan Service</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[22px] sm:text-[26px] font-extrabold text-foreground tracking-tight leading-none truncate">
              {formatCurrency(kpi.revenue)}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400 shrink-0">
              Selesai ▲
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('PROSES')}
          className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-primary/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#F97316] dark:text-orange-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Antrean Pengerjaan</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.active} Items
            </p>
          </div>
        </div>
      </div>

      {/* ===== KUSALE TOOLBAR ===== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Segmented Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto max-w-full">
          {(
            [
              { key: 'ALL', label: 'All Tickets' },
              { key: 'PROSES', label: 'In Progress' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'SELESAI', label: 'Completed' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ] as { key: SvcTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticket, item, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="h-10 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Terima Service</span>
          </button>
        </div>
      </div>

      {/* ===== KUSALE DATA TABLE ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Belum ada tiket service</p>
            <p className="text-xs text-muted-foreground mt-1">
              Klik &apos;Terima Service&apos; untuk menambah antrean servis perangkat.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border">
              {filteredServices.map((svc) => (
                <div key={svc.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary">{svc.serviceId}</p>
                      <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                        {svc.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {svc.clientName || 'Pelanggan Umum'} ·{' '}
                        {format(new Date(svc.date), 'dd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${getStatusBadge(
                        svc.status
                      )}`}
                    >
                      {svc.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2.5 rounded-xl">
                    Keluhan: {svc.complaint}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-bold text-foreground">
                      {svc.totalCost ? formatCurrency(svc.totalCost) : 'Belum ada biaya'}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedService(svc)
                          setDetailModalOpen(true)
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-bold text-[13px] text-foreground">
                      Device & Complaint
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Ticket ID
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Customer
                    </TableHead>
                    <TableHead
                      className="py-4 font-bold text-[13px] text-foreground cursor-pointer"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Date
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Total Cost
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="py-4 pr-6 text-right font-bold text-[13px] text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((svc) => (
                    <TableRow
                      key={svc.id}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                            <Wrench className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[13.5px] text-foreground truncate max-w-[240px]">
                              {svc.itemName}
                            </p>
                            <p
                              className="text-[12px] text-muted-foreground truncate max-w-[240px] mt-0.5"
                              title={svc.complaint}
                            >
                              {svc.complaint}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[13px] font-semibold text-primary">
                          {svc.serviceId}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-[13px] font-medium text-foreground">
                        {svc.clientName || 'Pelanggan Umum'}
                      </TableCell>
                      <TableCell className="py-4 text-[13px] text-muted-foreground font-medium">
                        {format(new Date(svc.date), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="py-4 font-bold text-[13.5px] text-foreground">
                        {svc.totalCost ? formatCurrency(svc.totalCost) : '-'}
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(
                            svc.status
                          )}`}
                        >
                          {svc.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedService(svc)
                              setDetailModalOpen(true)
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Lihat & Proses Service"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(svc.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <ServiceFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchServices}
      />

      <ServiceDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        service={selectedService as never}
        onSuccess={fetchServices}
      />
    </div>
  )
}
