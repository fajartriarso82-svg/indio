'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  picName: string | null
  picPhone: string | null
  category: string | null
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
  notes: string | null
  _count?: { purchases: number; additionalCosts: number }
  createdAt: string
}

interface VendorForm {
  name: string
  address: string
  phone: string
  email: string
  picName: string
  picPhone: string
  category: string
  bankName: string
  bankAccount: string
  bankHolder: string
  notes: string
}

const emptyForm: VendorForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  picName: '',
  picPhone: '',
  category: 'supplier',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  notes: '',
}

const categoryLabels: Record<string, string> = {
  supplier: 'Supplier',
  contractor: 'Kontraktor',
  'service-provider': 'Penyedia Layanan',
}

const categoryColors: Record<string, string> = {
  supplier: 'bg-primary/10 text-primary',
  contractor: 'bg-amber-50 text-amber-700',
  'service-provider': 'bg-emerald-50 text-emerald-700',
}

export default function VendorModule() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [deleting, setDeleting] = useState<Vendor | null>(null)
  const [form, setForm] = useState<VendorForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors')
      const data = await res.json()
      if (data.success) setVendors(data.data)
    } catch {
      toast({ title: 'Kesalahan', description: 'Gagal memuat vendor', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.picName || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const handleOpenEdit = (vendor: Vendor) => {
    setEditing(vendor)
    setForm({
      name: vendor.name,
      address: vendor.address || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      picName: vendor.picName || '',
      picPhone: vendor.picPhone || '',
      category: vendor.category || 'supplier',
      bankName: vendor.bankName || '',
      bankAccount: vendor.bankAccount || '',
      bankHolder: vendor.bankHolder || '',
      notes: vendor.notes || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: 'Kesalahan Validasi', description: 'Nama wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const url = editing ? `/api/vendors/${editing.id}` : '/api/vendors'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: editing ? 'Vendor Diperbarui' : 'Vendor Dibuat',
          description: `${form.name} telah ${editing ? 'diperbarui' : 'dibuat'} dengan berhasil.`,
        })
        setFormOpen(false)
        fetchVendors()
      } else {
        toast({ title: 'Kesalahan', description: data.error || 'Operasi gagal', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Kesalahan', description: 'Kesalahan jaringan', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/vendors/${deleting.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Vendor Dihapus', description: `${deleting.name} telah dihapus.` })
        setDeleteOpen(false)
        setDeleting(null)
        fetchVendors()
      } else {
        toast({ title: 'Kesalahan', description: data.error || 'Gagal menghapus', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Kesalahan', description: 'Kesalahan jaringan', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Vendor</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar vendor Anda</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Vendor
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Vendor</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari vendor..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground px-4 text-center">
              {search ? 'Tidak ada vendor yang cocok.' : 'Belum ada vendor. Buat vendor pertama Anda!'}
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{vendor.email || '—'}</p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          categoryColors[vendor.category || ''] || ''
                        }`}
                      >
                        {categoryLabels[vendor.category || ''] || vendor.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="text-muted-foreground">PIC</p>
                        <p className="truncate mt-0.5">{vendor.picName || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground">Telepon</p>
                        <p className="truncate mt-0.5">{vendor.phone || '—'}</p>
                      </div>
                      <div className="min-w-0 col-span-2">
                        <p className="text-muted-foreground">Bank</p>
                        <p className="truncate mt-0.5">{vendor.bankName || '—'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-9" onClick={() => handleOpenEdit(vendor)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleting(vendor)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                        <TableHead>Nama</TableHead>
                        <TableHead className="hidden md:table-cell">Kategori</TableHead>
                        <TableHead className="hidden sm:table-cell">PIC</TableHead>
                        <TableHead className="hidden lg:table-cell">Telepon</TableHead>
                        <TableHead className="hidden lg:table-cell">Bank</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{vendor.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{vendor.email || '—'}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${categoryColors[vendor.category || ''] || ''}`}>
                              {categoryLabels[vendor.category || ''] || vendor.category}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{vendor.picName || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{vendor.phone || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{vendor.bankName || '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(vendor)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleting(vendor)
                                  setDeleteOpen(true)
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vendor' : 'Tambah Vendor'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Perbarui informasi vendor' : 'Buat data vendor baru'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama vendor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="contractor">Kontraktor</SelectItem>
                    <SelectItem value="service-provider">Penyedia Layanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Alamat email"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={2}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-foreground mb-3">Penanggung Jawab (PIC)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="picName">Nama PIC</Label>
                  <Input
                    id="picName"
                    value={form.picName}
                    onChange={(e) => setForm({ ...form, picName: e.target.value })}
                    placeholder="Nama kontak person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="picPhone">Telepon PIC</Label>
                  <Input
                    id="picPhone"
                    value={form.picPhone}
                    onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                    placeholder="Nomor telepon PIC"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-foreground mb-3">Informasi Bank</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nama Bank</Label>
                  <Input
                    id="bankName"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Nama bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Nomor Rekening</Label>
                  <Input
                    id="bankAccount"
                    value={form.bankAccount}
                    onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                    placeholder="Nomor rekening"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bankHolder">Pemilik Rekening</Label>
                  <Input
                    id="bankHolder"
                    value={form.bankHolder}
                    onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                ) : (
                  editing ? 'Perbarui Vendor' : 'Buat Vendor'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleting?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
