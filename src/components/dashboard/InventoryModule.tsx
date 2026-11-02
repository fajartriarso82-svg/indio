'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus,
  Search,
  FileDown,
  FileUp,
  Eye,
  Loader2,
  Package,
  Pencil,
  Trash2,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingBag,
  Wallet,
  Clock,
  Laptop,
  Cpu,
  Wifi,
  Headphones,
  HardDrive,
  Monitor,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { ProductFormModal } from './ProductFormModal'

interface Product {
  id: string
  productId: string
  category: string
  subCategory: string
  name: string
  spec: string
  qty: number
  costPrice: number
  sellPrice: number
  retailPrice: number
  warranty: string
}

type StockTab = 'all' | 'overflow' | 'low' | 'out'

export default function InventoryModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<StockTab>('all')
  const [sortField, setSortField] = useState<'name' | 'qty' | 'sellPrice'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Floating Filter Popover state (Kusale style)
  const [filterOpen, setFilterOpen] = useState(false)
  const [stockSectionOpen, setStockSectionOpen] = useState(true)
  const [categorySectionOpen, setCategorySectionOpen] = useState(true)
  const [draftStockFilters, setDraftStockFilters] = useState<string[]>([])
  const [draftCategories, setDraftCategories] = useState<string[]>([])
  const [appliedStockFilters, setAppliedStockFilters] = useState<string[]>([])
  const [appliedCategories, setAppliedCategories] = useState<string[]>([])

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const filterPopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  // Close floating filter on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchProducts()
      } else {
        alert(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error(error)
      alert('Error deleting product')
    }
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nomor': 'BRG-001',
        'Kategori': 'Komputer & Perangkat Cerdas',
        'Sub Kategori': 'Laptop (Consumer, Gaming, Business)',
        'Nama Barang': 'Lenovo ThinkPad E14 Gen 4',
        'Spesifikasi': 'Core i5-1235U, RAM 16GB, SSD 512GB, 14 Inch FHD',
        'Stok': 10,
        'Harga Pokok (Rp)': 9500000,
        'Harga Jual (Rp)': 11000000,
        'Harga Eceran (Rp)': 11500000,
        'Garansi': '1 Tahun Resmi',
      },
      {
        'Nomor': 'BRG-002',
        'Kategori': 'Komponen PC (Hardware Internal)',
        'Sub Kategori': 'Penyimpanan Internal (SSD, HDD, NVMe)',
        'Nama Barang': 'Samsung SSD 980 NVMe M.2 500GB',
        'Spesifikasi': 'Read up to 3100 MB/s, Write up to 2600 MB/s',
        'Stok': 35,
        'Harga Pokok (Rp)': 650000,
        'Harga Jual (Rp)': 800000,
        'Harga Eceran (Rp)': 850000,
        'Garansi': '3 Tahun Distributor',
      },
      {
        'Nomor': 'BRG-003',
        'Kategori': 'Jaringan & Keamanan (Networking)',
        'Sub Kategori': 'Router & Access Point',
        'Nama Barang': 'MikroTik RouterBOARD RB750Gr3 (hEX)',
        'Spesifikasi': '5x Gigabit Ethernet, Dual Core 880MHz, 256MB RAM',
        'Stok': 3,
        'Harga Pokok (Rp)': 720000,
        'Harga Jual (Rp)': 850000,
        'Harga Eceran (Rp)': 900000,
        'Garansi': '1 Tahun',
      },
      {
        'Nomor': 'BRG-004',
        'Kategori': 'Periferal & Aksesoris',
        'Sub Kategori': 'Keyboard, Mouse & Mousepad',
        'Nama Barang': 'Logitech Wireless Mouse M185',
        'Spesifikasi': '2.4GHz Wireless, Nano Receiver, Baterai AA',
        'Stok': 0,
        'Harga Pokok (Rp)': 135000,
        'Harga Jual (Rp)': 175000,
        'Harga Eceran (Rp)': 190000,
        'Garansi': '1 Tahun Resmi',
      },
    ]

    const panduanData = [
      {
        'Kolom': 'Nomor',
        'Status': 'WAJIB',
        'Keterangan': 'Kode unik/SKU barang (contoh: BRG-001, LPT-001). Tidak boleh duplikat.',
      },
      {
        'Kolom': 'Kategori',
        'Status': 'WAJIB',
        'Keterangan': 'Nama kategori induk barang (contoh: Komputer & Perangkat Cerdas, Jaringan & Keamanan).',
      },
      {
        'Kolom': 'Sub Kategori',
        'Status': 'WAJIB',
        'Keterangan': 'Sub kategori barang (contoh: Laptop (Consumer, Gaming, Business), Router & Access Point).',
      },
      {
        'Kolom': 'Nama Barang',
        'Status': 'WAJIB',
        'Keterangan': 'Nama lengkap produk barang.',
      },
      {
        'Kolom': 'Spesifikasi',
        'Status': 'OPSIONAL',
        'Keterangan': 'Rincian spesifikasi teknis barang.',
      },
      {
        'Kolom': 'Stok',
        'Status': 'OPSIONAL',
        'Keterangan': 'Jumlah unit stok (hanya angka bulat, tanpa huruf/satuan. Default: 0).',
      },
      {
        'Kolom': 'Harga Pokok (Rp)',
        'Status': 'OPSIONAL',
        'Keterangan': 'Harga beli/modal per unit (hanya angka tanpa Rp dan tanpa titik ribuan).',
      },
      {
        'Kolom': 'Harga Jual (Rp)',
        'Status': 'OPSIONAL',
        'Keterangan': 'Harga jual standar/proyek per unit (hanya angka tanpa Rp dan tanpa titik).',
      },
      {
        'Kolom': 'Harga Eceran (Rp)',
        'Status': 'OPSIONAL',
        'Keterangan': 'Harga ritel per unit (hanya angka tanpa Rp dan tanpa titik).',
      },
      {
        'Kolom': 'Garansi',
        'Status': 'OPSIONAL',
        'Keterangan': 'Keterangan masa garansi (contoh: 1 Tahun Resmi, 3 Bulan).',
      },
    ]

    const workbook = XLSX.utils.book_new()
    const wsTemplate = XLSX.utils.json_to_sheet(templateData)
    wsTemplate['!cols'] = [
      { wch: 14 },
      { wch: 32 },
      { wch: 36 },
      { wch: 38 },
      { wch: 45 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(workbook, wsTemplate, 'Template Import')

    const wsPanduan = XLSX.utils.json_to_sheet(panduanData)
    wsPanduan['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 75 }]
    XLSX.utils.book_append_sheet(workbook, wsPanduan, 'Panduan Kolom')

    XLSX.writeFile(workbook, 'Template_Import_Stok_Barang.xlsx')
  }

  const handleExportExcel = () => {
    if (products.length === 0) {
      alert('Tidak ada data stok untuk di-export.')
      return
    }

    const exportData = products.map((p) => ({
      'Nomor': p.productId,
      'Kategori': p.category,
      'Sub Kategori': p.subCategory || '',
      'Nama Barang': p.name,
      'Spesifikasi': p.spec || '',
      'Stok': p.qty,
      'Harga Pokok (Rp)': p.costPrice,
      'Harga Jual (Rp)': p.sellPrice,
      'Harga Eceran (Rp)': p.retailPrice,
      'Garansi': p.warranty || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 32 },
      { wch: 36 },
      { wch: 38 },
      { wch: 45 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Stok_Z-Indio_${dateStr}.xlsx`)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws)

        const formattedData = data
          .map((rawItem) => {
            const item: Record<string, unknown> = {}
            Object.keys(rawItem).forEach((k) => {
              item[k.toLowerCase().trim()] = rawItem[k]
            })

            return {
              productId: String(item['nomor'] || item['id'] || item['productid'] || ''),
              category: String(item['kategori'] || item['category'] || ''),
              subCategory: String(
                item['sub kategori'] || item['subkategori'] || item['subcategory'] || ''
              ),
              name: String(item['nama barang'] || item['nama'] || item['name'] || ''),
              spec: String(item['spesifikasi'] || item['spec'] || ''),
              qty: Number(item['stok'] || item['qty']) || 0,
              costPrice:
                Number(item['harga pokok (rp)'] || item['harga pokok'] || item['costprice']) || 0,
              sellPrice:
                Number(item['harga jual (rp)'] || item['harga jual'] || item['sellprice']) || 0,
              retailPrice:
                Number(item['harga eceran (rp)'] || item['harga eceran'] || item['retailprice']) ||
                0,
              warranty: String(item['garansi'] || item['warranty'] || ''),
            }
          })
          .filter((item) => item.productId && item.category && item.subCategory && item.name)

        if (formattedData.length === 0) {
          alert(
            'Data tidak valid. Pastikan kolom Nomor, Kategori, Sub Kategori, dan Nama Barang tidak kosong.'
          )
          setIsImporting(false)
          return
        }

        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: formattedData }),
        })
        const resData = await res.json()

        if (resData.success) {
          alert(
            `Berhasil mengimport ${resData.data.imported} barang baru dan update ${resData.data.updated} barang.`
          )
          fetchProducts()
        } else {
          alert('Gagal mengimport data.')
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('Terjadi kesalahan saat memproses file Excel.')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  // Unique categories for filter popover
  const allCategories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [products])

  // KPI computations
  const kpiStats = useMemo(() => {
    const totalItems = products.length
    const totalUnits = products.reduce((acc, p) => acc + (p.qty || 0), 0)
    const totalRevenueValue = products.reduce(
      (acc, p) => acc + Math.max(0, p.qty || 0) * (p.sellPrice || 0),
      0
    )
    const totalCostValue = products.reduce(
      (acc, p) => acc + Math.max(0, p.qty || 0) * (p.costPrice || 0),
      0
    )
    const outOfStockCount = products.filter((p) => (p.qty ?? 0) <= 0).length
    const lowStockCount = products.filter((p) => p.qty > 0 && p.qty <= 5).length
    const marginPct =
      totalCostValue > 0
        ? (((totalRevenueValue - totalCostValue) / totalCostValue) * 100).toFixed(1)
        : '16.8'

    return {
      totalItems,
      totalUnits,
      totalRevenueValue,
      outOfStockCount,
      lowStockCount,
      attentionCount: outOfStockCount + lowStockCount,
      marginPct,
    }
  }, [products])

  const getStockStatus = (qty: number): { key: StockTab; label: string; badgeClass: string } => {
    if (qty <= 0) {
      return {
        key: 'out',
        label: 'Out of Stock',
        badgeClass:
          'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
      }
    }
    if (qty <= 5) {
      return {
        key: 'low',
        label: 'Low Stock',
        badgeClass:
          'bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400',
      }
    }
    if (qty >= 25) {
      return {
        key: 'overflow',
        label: 'Overflow Stock',
        badgeClass:
          'bg-[#EEF0FF] text-[#3B4DF8] dark:bg-primary/20 dark:text-[#8190FF]',
      }
    }
    return {
      key: 'all',
      label: 'In Stock',
      badgeClass:
        'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
    }
  }

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase()
    if (c.includes('komputer') || c.includes('laptop')) return Laptop
    if (c.includes('komponen') || c.includes('hardware') || c.includes('processor')) return Cpu
    if (c.includes('jaringan') || c.includes('network') || c.includes('router')) return Wifi
    if (c.includes('periferal') || c.includes('aksesoris') || c.includes('audio')) return Headphones
    if (c.includes('storage') || c.includes('ssd') || c.includes('server')) return HardDrive
    return Monitor
  }

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          p.productId.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q))

        if (!matchSearch) return false

        // Segmented Tab
        const st = getStockStatus(p.qty).key
        if (activeTab === 'overflow' && st !== 'overflow') return false
        if (activeTab === 'low' && st !== 'low') return false
        if (activeTab === 'out' && st !== 'out') return false

        // Floating Filter Popover: Stock Status
        if (appliedStockFilters.length > 0) {
          if (!appliedStockFilters.includes(st)) return false
        }

        // Floating Filter Popover: Categories
        if (appliedCategories.length > 0) {
          if (!appliedCategories.includes(p.category)) return false
        }

        return true
      })
      .sort((a, b) => {
        const mult = sortDir === 'asc' ? 1 : -1
        if (sortField === 'name') return a.name.localeCompare(b.name) * mult
        if (sortField === 'qty') return (a.qty - b.qty) * mult
        if (sortField === 'sellPrice') return (a.sellPrice - b.sellPrice) * mult
        return 0
      })
  }, [products, search, activeTab, appliedStockFilters, appliedCategories, sortField, sortDir])

  const toggleSort = (field: 'name' | 'qty' | 'sellPrice') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const openFilterPopover = () => {
    setDraftStockFilters(appliedStockFilters)
    setDraftCategories(appliedCategories)
    setFilterOpen((prev) => !prev)
  }

  const toggleDraftStock = (val: string) => {
    setDraftStockFilters((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    )
  }

  const toggleDraftCategory = (cat: string) => {
    setDraftCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    )
  }

  const handleResetFilters = () => {
    setDraftStockFilters([])
    setDraftCategories([])
    setAppliedStockFilters([])
    setAppliedCategories([])
  }

  const handleApplyFilters = () => {
    setAppliedStockFilters(draftStockFilters)
    setAppliedCategories(draftCategories)
    setFilterOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const activeFilterCount = appliedStockFilters.length + appliedCategories.length

  return (
    <div className="space-y-6">
      {/* ===== KUSALE 3 KPI SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Products / Stock (Kusale Total Orders style) */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">
            Total Produk & Unit
          </p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {formatNumber(kpiStats.totalItems)}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              {formatNumber(kpiStats.totalUnits)} Unit ▲
            </span>
          </div>
        </div>

        {/* Card 2: Total Inventory Value (Kusale Monthly Revenue style) */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30">
          <div className="w-10 h-10 rounded-xl bg-[#E6F8F3] dark:bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">
            Nilai Persediaan (Est. Jual)
          </p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p
              className="text-[22px] sm:text-[26px] font-extrabold text-foreground tracking-tight leading-none truncate"
              title={formatCurrency(kpiStats.totalRevenueValue)}
            >
              {formatCurrency(kpiStats.totalRevenueValue)}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400 shrink-0">
              {kpiStats.marginPct}% ▲
            </span>
          </div>
        </div>

        {/* Card 3: Out of Stock / Low Stock (Kusale Out Of Stock -> 44 Items style) */}
        <div
          onClick={() => setActiveTab(kpiStats.outOfStockCount > 0 ? 'out' : 'low')}
          className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#F97316] dark:text-orange-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">
            Out Of Stock & Low Stock
          </p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpiStats.attentionCount} Items
            </p>
            {kpiStats.outOfStockCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400">
                {kpiStats.outOfStockCount} Habis
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== KUSALE TOOLBAR: SEGMENTED TABS + SEARCH + ACTIONS + FLOATING FILTER ===== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Segmented Stock Tabs (All Stock | Overflow Stock | Low Stock | Out Of Stock) */}
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto max-w-full">
          {(
            [
              { key: 'all', label: 'All Stock' },
              { key: 'overflow', label: 'Overflow Stock' },
              { key: 'low', label: 'Low Stock' },
              { key: 'out', label: 'Out Of Stock' },
            ] as { key: StockTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Right: Search + Excel Buttons + Filters Popover + Add Product */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search stock or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Hidden Excel file input */}
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />

          <button
            onClick={handleDownloadTemplate}
            title="Download Template Excel (.xlsx)"
            className="h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            title="Import dari Excel"
            className="h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-[13px] font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            onClick={handleExportExcel}
            title="Export ke Excel"
            className="h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Kusale Floating Filters Button & Popover */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              onClick={openFilterPopover}
              className={`h-10 px-3.5 rounded-xl border text-[13px] font-medium inline-flex items-center gap-2 transition-all ${
                filterOpen || activeFilterCount > 0
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-border bg-card hover:bg-muted text-foreground'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Floating Filter Popover Card (Exact Kusale Design) */}
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-popover border border-border rounded-2xl shadow-2xl p-5 z-40">
                {/* Popover Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] font-bold text-foreground">Filters</span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>

                {/* Section 1: Product Stock */}
                <div className="border border-border rounded-xl overflow-hidden mb-3.5">
                  <button
                    type="button"
                    onClick={() => setStockSectionOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/60 text-xs font-bold text-foreground"
                  >
                    <span>Product Stock</span>
                    {stockSectionOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {stockSectionOpen && (
                    <div className="p-3.5 space-y-2.5 bg-card">
                      {[
                        { id: 'overflow', label: 'Overflow Stock' },
                        { id: 'low', label: 'Low Stock' },
                        { id: 'out', label: 'Out Of Stock' },
                      ].map((item) => {
                        const checked = draftStockFilters.includes(item.id)
                        return (
                          <label
                            key={item.id}
                            onClick={() => toggleDraftStock(item.id)}
                            className="flex items-center gap-2.5 cursor-pointer select-none group"
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-[5px] flex items-center justify-center border transition-all ${
                                checked
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-muted-foreground/40 group-hover:border-primary'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground">
                              {item.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Category */}
                <div className="border border-border rounded-xl overflow-hidden mb-4">
                  <button
                    type="button"
                    onClick={() => setCategorySectionOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/60 text-xs font-bold text-foreground"
                  >
                    <span>Category</span>
                    {categorySectionOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {categorySectionOpen && (
                    <div className="p-3.5 space-y-2.5 bg-card max-h-44 overflow-y-auto">
                      {allCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Belum ada kategori</p>
                      ) : (
                        allCategories.map((cat) => {
                          const checked = draftCategories.includes(cat)
                          return (
                            <label
                              key={cat}
                              onClick={() => toggleDraftCategory(cat)}
                              className="flex items-center gap-2.5 cursor-pointer select-none group"
                            >
                              <div
                                className={`w-4.5 h-4.5 rounded-[5px] flex items-center justify-center border shrink-0 transition-all ${
                                  checked
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/40 group-hover:border-primary'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground truncate">
                                {cat}
                              </span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Popover Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm shadow-primary/25 transition-all"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => {
              setEditingProduct(null)
              setIsModalOpen(true)
            }}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* ===== KUSALE PRODUCT TABLE ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Tidak ada barang ditemukan</p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Sesuaikan filter pencarian atau klik &apos;Tambah Barang&apos; / &apos;Import&apos; untuk mengisi stok.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Card List */}
            <div className="md:hidden divide-y divide-border">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p.qty)
                const CatIcon = getCategoryIcon(p.category)
                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                          <CatIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-primary font-semibold mt-0.5">{p.productId}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {p.subCategory || p.spec || '-'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-muted/50 rounded-xl p-3">
                      <div>
                        <p className="text-muted-foreground">Stok</p>
                        <p className="font-bold text-foreground mt-0.5">{formatNumber(p.qty)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Harga Pokok</p>
                        <p className="font-semibold text-foreground mt-0.5">{formatCurrency(p.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Harga Jual</p>
                        <p className="font-semibold text-primary mt-0.5">{formatCurrency(p.sellPrice)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setEditingProduct(p)
                          setIsModalOpen(true)
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewingProduct(p)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View: Kusale Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-bold text-[13px] text-foreground">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <span>Product</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">SKU</TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">Category</TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      <button
                        type="button"
                        onClick={() => toggleSort('qty')}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <span>Stock</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      <button
                        type="button"
                        onClick={() => toggleSort('sellPrice')}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <span>Price</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">Status</TableHead>
                    <TableHead className="py-4 pr-6 text-right font-bold text-[13px] text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const status = getStockStatus(p.qty)
                    const CatIcon = getCategoryIcon(p.category)
                    return (
                      <TableRow
                        key={p.id}
                        className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                      >
                        {/* Product Cell: Thumbnail Box + Bold Name + Muted Brand/SubCategory */}
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                              <CatIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[13.5px] text-foreground leading-snug truncate max-w-[260px]">
                                {p.name}
                              </p>
                              <p
                                className="text-[12px] text-muted-foreground truncate max-w-[260px] mt-0.5"
                                title={p.spec || p.subCategory}
                              >
                                {p.subCategory || p.spec || 'General Item'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* SKU Cell in Royal Blue */}
                        <TableCell className="py-4">
                          <span className="text-[13px] font-semibold text-primary">
                            {p.productId}
                          </span>
                        </TableCell>

                        {/* Category Cell */}
                        <TableCell className="py-4">
                          <span className="text-[13px] font-medium text-muted-foreground">
                            {p.category}
                          </span>
                        </TableCell>

                        {/* Stock Cell */}
                        <TableCell className="py-4">
                          <span className="text-[13.5px] font-semibold text-foreground">
                            {formatNumber(p.qty)}
                          </span>
                        </TableCell>

                        {/* Price Cell */}
                        <TableCell className="py-4">
                          <div>
                            <span className="text-[13.5px] font-semibold text-foreground">
                              {formatCurrency(p.sellPrice)}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              Modal: {formatCurrency(p.costPrice)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Pill Cell (Out of Stock / Low Stock / Overflow Stock / In Stock) */}
                        <TableCell className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </TableCell>

                        {/* Action Icons Cell (Pencil, Eye, Trash) */}
                        <TableCell className="py-4 pr-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p)
                                setIsModalOpen(true)
                              }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit Barang"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewingProduct(p)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Lihat Detail Barang"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Modal Form Tambah / Edit Barang */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        product={editingProduct}
      />

      {/* Modal Lihat Detail Barang */}
      <Dialog open={Boolean(viewingProduct)} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{viewingProduct?.name}</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-primary">
              SKU: {viewingProduct?.productId}
            </DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/60 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p className="font-semibold text-foreground mt-0.5">{viewingProduct.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sub Kategori</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {viewingProduct.subCategory || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stok Saat Ini</p>
                  <p className="font-bold text-foreground mt-0.5">
                    {formatNumber(viewingProduct.qty)} Unit
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Garansi</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {viewingProduct.warranty || '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Spesifikasi</p>
                <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/60 leading-relaxed">
                  {viewingProduct.spec || 'Tidak ada catatan spesifikasi.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground">Harga Pokok</p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {formatCurrency(viewingProduct.costPrice)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-[11px] text-primary font-medium">Harga Jual</p>
                  <p className="text-xs font-bold text-primary mt-1">
                    {formatCurrency(viewingProduct.sellPrice)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground">Harga Eceran</p>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {formatCurrency(viewingProduct.retailPrice)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewingProduct(null)}>
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    const prod = viewingProduct
                    setViewingProduct(null)
                    setEditingProduct(prod)
                    setIsModalOpen(true)
                  }}
                >
                  Edit Barang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
