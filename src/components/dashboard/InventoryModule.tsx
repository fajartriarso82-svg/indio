'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, FileDown, FileUp, Eye, Loader2, Package, Edit, Trash2 } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function InventoryModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProducts()
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

  const handleExportExcel = () => {
    if (products.length === 0) {
      alert('Tidak ada data stok untuk di-export.')
      return
    }

    // Prepare data
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
      'Garansi': p.warranty || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok')

    // Filename: Stok + [nama perusahaan] + [tanggal hari ini]
    // Kita anggap nama perusahaan "Z-Indio" atau Anda bisa ganti.
    const companyName = 'Z-Indio'
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `Stok_${companyName}_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
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
        const data: any[] = XLSX.utils.sheet_to_json(ws)

        // Normalize keys to lowercase to handle different excel headers
        const formattedData = data.map(rawItem => {
          const item: Record<string, any> = {}
          Object.keys(rawItem).forEach(k => {
            item[k.toLowerCase().trim()] = rawItem[k]
          })

          return {
            productId: item['nomor'] || item['id'] || item['productid'] || '',
            category: item['kategori'] || item['category'] || '',
            subCategory: item['sub kategori'] || item['subkategori'] || item['subcategory'] || '',
            name: item['nama barang'] || item['nama'] || item['name'] || '',
            spec: item['spesifikasi'] || item['spec'] || '',
            qty: Number(item['stok'] || item['qty']) || 0,
            costPrice: Number(item['harga pokok (rp)'] || item['harga pokok'] || item['costprice']) || 0,
            sellPrice: Number(item['harga jual (rp)'] || item['harga jual'] || item['sellprice']) || 0,
            retailPrice: Number(item['harga eceran (rp)'] || item['harga eceran'] || item['retailprice']) || 0,
            warranty: item['garansi'] || item['warranty'] || ''
          }
        }).filter(item => item.productId && item.category && item.subCategory && item.name) // Enforce required fields

        if (formattedData.length === 0) {
          alert('Data tidak valid. Pastikan kolom Nomor, Kategori, Sub Kategori, dan Nama Barang tidak kosong.')
          setIsImporting(false)
          return
        }

        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: formattedData })
        })
        const resData = await res.json()

        if (resData.success) {
          alert(`Berhasil mengimport ${resData.data.imported} barang baru dan update ${resData.data.updated} barang.`)
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

  const filteredProducts = products.filter(
    (p) =>
      p.productId.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Stok Barang</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola persediaan barang, import/export, dan harga.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Import Excel
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="w-4 h-4" />
            Export Excel
          </Button>
          <Button 
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => {
              setEditingProduct(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Tambah Barang
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Barang</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ID, Nama, Kategori..."
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
          ) : filteredProducts.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4">
              <Package className="w-8 h-8 mb-2 text-muted-foreground/50" />
              <p className="font-medium text-foreground">Stok kosong</p>
              <p className="text-sm text-center">Klik 'Tambah Barang' atau 'Import Excel' untuk mengisi stok.</p>
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{p.productId}</p>
                        <p className="font-semibold text-sm mt-0.5">{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.spec || '-'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">Stok</p>
                        <p className="font-bold text-base">{formatNumber(p.qty)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      {p.subCategory && <Badge variant="outline" className="text-xs">{p.subCategory}</Badge>}
                      {p.warranty && <Badge variant="outline" className="text-xs">Garansi {p.warranty}</Badge>}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-muted/40 rounded-md p-2.5">
                      <div>
                        <p className="text-muted-foreground">Pokok</p>
                        <p className="font-medium mt-0.5">{formatCurrency(p.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jual</p>
                        <p className="font-medium text-emerald-600 mt-0.5">{formatCurrency(p.sellPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Eceran</p>
                        <p className="font-medium text-blue-600 mt-0.5">{formatCurrency(p.retailPrice)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setEditingProduct(p)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(p.id)}
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
                  <Table className="whitespace-nowrap">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nomor / ID</TableHead>
                        <TableHead>Nama Barang & Spek</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">QTY</TableHead>
                        <TableHead className="text-right">Harga Pokok</TableHead>
                        <TableHead className="text-right">Harga Jual</TableHead>
                        <TableHead className="text-right">Harga Eceran</TableHead>
                        <TableHead>Garansi</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.productId}</TableCell>
                          <TableCell>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={p.spec}>{p.spec || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <div>{p.category}</div>
                            <div className="text-xs text-muted-foreground">{p.subCategory || '-'}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(p.qty)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(p.costPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600">
                            {formatCurrency(p.sellPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {formatCurrency(p.retailPrice)}
                          </TableCell>
                          <TableCell className="text-xs">{p.warranty || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingProduct(p)
                                  setIsModalOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-100"
                                onClick={() => handleDelete(p.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
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

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        product={editingProduct}
      />
    </div>
  )
}
