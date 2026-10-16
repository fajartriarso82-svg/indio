'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  Mail,
  Store,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCompanyProfile } from '@/hooks/use-company-profile'

interface EtalaseProduct {
  id: string
  productId: string
  name: string
  category: string
  subCategory?: string | null
  spec?: string | null
  sellPrice: number
  retailPrice?: number | null
  qty: number
  warranty?: string | null
}

export default function EtalasePage() {
  const { company } = useCompanyProfile()
  const [products, setProducts] = useState<EtalaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA')
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false)

  const companyName = company?.name?.trim() || 'PT Inti Nusa Dinamika Optima'
  const logoUrl = company?.logoFile?.trim() || ''
  const email = company?.email?.trim() || ''

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products/public')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Gagal mengambil data produk etalase:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Mengumpulkan daftar kategori unik dari data produk
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['SEMUA', ...Array.from(set)]
  }, [products])

  // Filter produk berdasarkan pencarian, kategori, dan ketersediaan stok
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      // Filter kategori
      if (selectedCategory !== 'SEMUA' && p.category !== selectedCategory) {
        return false
      }
      // Filter ketersediaan stok
      if (onlyAvailable && p.qty <= 0) {
        return false
      }
      // Filter teks pencarian (Nama, Kode SKU, Kategori, Sub Kategori, Spesifikasi)
      if (q) {
        const matchName = p.name?.toLowerCase().includes(q)
        const matchCode = p.productId?.toLowerCase().includes(q)
        const matchCategory = p.category?.toLowerCase().includes(q)
        const matchSubCategory = p.subCategory?.toLowerCase().includes(q)
        const matchSpec = p.spec?.toLowerCase().includes(q)
        return matchName || matchCode || matchCategory || matchSubCategory || matchSpec
      }
      return true
    })
  }, [products, search, selectedCategory, onlyAvailable])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-800">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary transition-colors py-1.5 px-2.5 rounded-md hover:bg-slate-100"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <div className="w-8 h-8 rounded-md overflow-hidden bg-white border border-slate-200 p-0.5 shrink-0 flex items-center justify-center">
                  <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  <Store className="w-4 h-4" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                  {companyName}
                </span>
                <span className="text-[10px] text-teal-700 font-medium">Etalase Toko</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {email && (
              <a
                href={`mailto:${email}?subject=Tanya%20Stok%20%26%20Harga%20Produk%20Etalase`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-md transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                Hubungi via Email
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              disabled={loading}
              className="h-8 px-2.5 text-xs"
              title="Segarkan data stok"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner Ringkas */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <Package className="w-3.5 h-3.5" />
              Katalog & Ketersediaan Stok
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Etalase Toko
            </h1>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              Cek harga resmi dan ketersediaan stok produk secara langsung. Gunakan kotak pencarian di bawah untuk mencari barang yang Anda butuhkan.
            </p>
          </div>
        </div>

        {/* Kontrol Pencarian & Filter */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama barang, spesifikasi, atau kode..."
                  className="pl-9 pr-9 h-10 text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-teal-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Ketersediaan */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={onlyAvailable ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`h-10 text-xs gap-1.5 ${
                    onlyAvailable
                      ? 'bg-teal-700 hover:bg-teal-800 text-white'
                      : 'text-slate-600 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hanya yang Tersedia
                </Button>
              </div>
            </div>

            {/* Filter Kategori Chips */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Kategori:
                </span>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'SEMUA' ? 'Semua Kategori' : cat}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredProducts.length}</strong> produk
            {selectedCategory !== 'SEMUA' && (
              <> pada kategori <strong className="text-slate-800">{selectedCategory}</strong></>
            )}
            {search && (
              <> untuk kata kunci &ldquo;<strong className="text-slate-800">{search}</strong>&rdquo;</>
            )}
          </span>
          <span className="text-[11px] text-slate-400">
            *Harga belum termasuk PPN bila ada
          </span>
        </div>

        {/* Tabel Etalase Sederhana: No | Nama Barang | Harga Jual | qty */}
        <Card className="border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-14 text-center font-bold text-slate-700">No</TableHead>
                  <TableHead className="min-w-[260px] font-bold text-slate-700">Nama Barang</TableHead>
                  <TableHead className="min-w-[150px] text-right font-bold text-slate-700">Harga Jual</TableHead>
                  <TableHead className="min-w-[120px] text-center font-bold text-slate-700">Stok (Qty)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                        <span className="text-xs">Memuat data etalase...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Package className="w-8 h-8 stroke-1 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">Tidak ada produk ditemukan</p>
                        <p className="text-xs text-slate-400">
                          Coba ganti kata kunci pencarian atau pilih kategori lain.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isAvailable = p.qty > 0
                    return (
                      <TableRow
                        key={p.id}
                        className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                      >
                        {/* No */}
                        <TableCell className="text-center font-medium text-slate-500 text-xs">
                          {idx + 1}
                        </TableCell>

                        {/* Nama Barang */}
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-sm text-slate-900">
                                {p.name}
                              </span>
                              {p.productId && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                  {p.productId}
                                </span>
                              )}
                            </div>

                            {/* Spesifikasi teknis ringkas */}
                            {p.spec && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {p.spec}
                              </p>
                            )}

                            {/* Meta info: Kategori & Garansi */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                              {p.category && (
                                <span>{p.category} {p.subCategory ? `› ${p.subCategory}` : ''}</span>
                              )}
                              {p.warranty && (
                                <>
                                  <span>•</span>
                                  <span className="text-teal-700 font-medium">Garansi: {p.warranty}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Harga Jual */}
                        <TableCell className="text-right py-3 align-top sm:align-middle">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-sm text-slate-900 font-mono">
                              {formatCurrency(p.sellPrice)}
                            </span>
                            {p.retailPrice && p.retailPrice !== p.sellPrice && (
                              <span className="text-[10px] text-slate-400">
                                Eceran: {formatCurrency(p.retailPrice)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Qty */}
                        <TableCell className="text-center py-3 align-top sm:align-middle">
                          {isAvailable ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2 py-0.5 text-xs inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{p.qty} unit</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-rose-50 text-rose-700 border-rose-200 font-medium px-2 py-0.5 text-xs inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Habis</span>
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Catatan Bantuan / Call to Action */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">
              Butuh penawaran pengadaan atau konsultasi proyek?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Harga dan ketersediaan barang dapat disesuaikan untuk kebutuhan skala proyek / instansi (Siplah, E-Katalog, Padi UMKM). Silakan hubungi kami via email{email ? `: ${email}` : ''}.
            </p>
          </div>
          {email ? (
            <a
              href={`mailto:${email}?subject=Penawaran%20Pengadaan%20Produk%20Etalase`}
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-md transition-colors shrink-0 shadow-xs"
            >
              <Mail className="w-4 h-4" />
              Hubungi via Email
            </a>
          ) : (
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-md transition-colors shrink-0 shadow-xs"
            >
              Lihat Kontak Kami
            </Link>
          )}
        </div>
      </main>

      {/* Footer Sederhana */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} {companyName}. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>•</span>
            <Link href="/#services" className="hover:text-primary transition-colors">
              Layanan
            </Link>
            <span>•</span>
            <Link href="/#contact" className="hover:text-primary transition-colors">
              Kontak
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
