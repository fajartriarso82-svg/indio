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
  Phone,
  Mail,
  User,
  AlertCircle,
  Star,
  Upload,
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

interface Client {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  picName: string | null
  picPhone: string | null
  picEmail: string | null
  type: string
  notes: string | null
  isStarred?: boolean
  iconUrl?: string | null
  _count?: { projects: number }
  createdAt: string
}

interface ClientForm {
  name: string
  address: string
  phone: string
  email: string
  picName: string
  picPhone: string
  picEmail: string
  type: string
  notes: string
  isStarred: boolean
  iconUrl: string
}

const emptyForm: ClientForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  picName: '',
  picPhone: '',
  picEmail: '',
  type: 'corporate',
  notes: '',
  isStarred: false,
  iconUrl: '',
}

const typeLabels: Record<string, string> = {
  corporate: 'Korporat',
  government: 'Pemerintah',
  individual: 'Perorangan',
}

const typeColors: Record<string, string> = {
  corporate: 'bg-primary/10 text-primary',
  government: 'bg-amber-50 text-amber-700',
  individual: 'bg-emerald-50 text-emerald-700',
}

export default function ClientModule() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (data.success) setClients(data.data)
    } catch {
      toast({ title: 'Kesalahan', description: 'Gagal memuat klien', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.picName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditing(client)
    setForm({
      name: client.name,
      address: client.address || '',
      phone: client.phone || '',
      email: client.email || '',
      picName: client.picName || '',
      picPhone: client.picPhone || '',
      picEmail: client.picEmail || '',
      type: client.type,
      notes: client.notes || '',
      isStarred: Boolean(client.isStarred),
      iconUrl: client.iconUrl || '',
    })
    setFormOpen(true)
  }

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIcon(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, iconUrl: data.url }))
        toast({ title: 'Berhasil', description: 'Logo/icon klien berhasil diunggah' })
      } else {
        toast({ title: 'Gagal', description: data.error || 'Gagal mengunggah logo', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan saat mengunggah logo', variant: 'destructive' })
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleToggleStar = async (client: Client) => {
    const newStarred = !client.isStarred
    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, isStarred: newStarred } : c))
    )
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStarred }),
      })
      const data = await res.json()
      if (!data.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, isStarred: !newStarred } : c))
        )
        toast({ title: 'Gagal', description: 'Gagal mengubah status bintang', variant: 'destructive' })
      } else {
        toast({
          title: newStarred ? 'Bintang Diberikan ⭐' : 'Bintang Dihapus',
          description: `${client.name} ${newStarred ? 'akan tampil di landing page.' : 'tidak akan tampil di landing page.'}`,
        })
      }
    } catch {
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, isStarred: !newStarred } : c))
      )
      toast({ title: 'Gagal', description: 'Kesalahan jaringan', variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: 'Kesalahan Validasi', description: 'Nama wajib diisi', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const url = editing ? `/api/clients/${editing.id}` : '/api/clients'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: editing ? 'Klien Diperbarui' : 'Klien Dibuat',
          description: `${form.name} telah ${editing ? 'diperbarui' : 'dibuat'} dengan berhasil.`,
        })
        setFormOpen(false)
        fetchClients()
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
      const res = await fetch(`/api/clients/${deleting.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Klien Dihapus', description: `${deleting.name} telah dihapus.` })
        setDeleteOpen(false)
        setDeleting(null)
        fetchClients()
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Klien</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar klien Anda</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Klien
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Klien</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari klien..."
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
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
              <p className="font-medium text-foreground">
                {search ? 'Tidak ada klien yang cocok' : 'Belum ada klien'}
              </p>
              <p className="text-sm">
                {search ? 'Coba kata kunci lain.' : 'Buat klien pertama Anda untuk memulai.'}
              </p>
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {filteredClients.map((client) => (
                  <div key={client.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {client.iconUrl ? (
                            <img src={client.iconUrl} alt={client.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                            {client.name}
                            {client.isStarred && (
                              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-600 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                                ⭐ Landing
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{client.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          onClick={() => handleToggleStar(client)}
                          title={client.isStarred ? 'Hapus dari landing page' : 'Beri bintang & tampilkan di landing page'}
                        >
                          <Star className={`w-4 h-4 ${client.isStarred ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/40'}`} />
                        </Button>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            typeColors[client.type] || ''
                          }`}
                        >
                          {typeLabels[client.type] || client.type}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="text-muted-foreground">PIC</p>
                        <p className="truncate mt-0.5">{client.picName || '—'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground">Telepon</p>
                        <p className="truncate mt-0.5">{client.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Proyek</p>
                        <p className="mt-0.5">
                          <Badge variant="secondary" className="text-[11px]">
                            {client._count?.projects ?? 0}
                          </Badge>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-9" onClick={() => handleOpenEdit(client)}>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleting(client)
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
                        <TableHead className="w-12 text-center">Bintang</TableHead>
                        <TableHead>Klien & Logo</TableHead>
                        <TableHead className="hidden md:table-cell">Tipe</TableHead>
                        <TableHead className="hidden sm:table-cell">PIC</TableHead>
                        <TableHead className="hidden lg:table-cell">Telepon</TableHead>
                        <TableHead className="hidden lg:table-cell">Proyek</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                              onClick={() => handleToggleStar(client)}
                              title={client.isStarred ? 'Klien Unggulan (Tampil di Landing Page) - Klik untuk batalkan' : 'Klik untuk beri bintang & tampilkan di Landing Page'}
                            >
                              <Star className={`w-4 h-4 ${client.isStarred ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/40 hover:text-amber-400'}`} />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg border bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                                {client.iconUrl ? (
                                  <img src={client.iconUrl} alt={client.name} className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground flex items-center gap-1.5">
                                  {client.name}
                                  {client.isStarred && (
                                    <span className="inline-flex items-center text-[10px] font-semibold bg-amber-500/15 text-amber-600 px-1.5 py-0.2 rounded border border-amber-500/30">
                                      ⭐ Landing
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email || '—'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeColors[client.type] || ''}`}>
                              {typeLabels[client.type] || client.type}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{client.picName || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">{client.phone || '—'}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary" className="text-[11px]">
                              {client._count?.projects ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(client)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleting(client)
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
            <DialogTitle>{editing ? 'Edit Klien' : 'Tambah Klien'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Perbarui informasi klien' : 'Buat data klien baru'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Star badge toggle banner */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border bg-amber-500/5 border-amber-500/25">
              <input
                type="checkbox"
                id="isStarred"
                checked={form.isStarred}
                onChange={(e) => setForm({ ...form, isStarred: e.target.checked })}
                className="h-4 w-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
              />
              <div className="space-y-0.5">
                <Label htmlFor="isStarred" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  Beri Bintang ⭐ (Tampilkan di Landing Page)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Klien yang diberi bintang akan tampil di carousel &quot;Dipercaya oleh Pemimpin Industri&quot; pada landing page.
                </p>
              </div>
            </div>

            {/* Logo / Icon Upload */}
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Logo / Icon Klien</Label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {form.iconUrl ? (
                    <img src={form.iconUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <label className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                      {uploadingIcon ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mengunggah...</>
                      ) : (
                        <><Upload className="w-3.5 h-3.5 mr-1.5" /> Unggah File Logo</>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingIcon}
                        onChange={handleIconUpload}
                      />
                    </label>
                    {form.iconUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setForm({ ...form, iconUrl: '' })}
                      >
                        Hapus Logo
                      </Button>
                    )}
                  </div>
                  <Input
                    value={form.iconUrl}
                    onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                    placeholder="Atau tempel URL icon (https://...)"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Format PNG, JPG, SVG, atau WebP. Logo ini akan ditampilkan di carousel landing page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama klien"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Korporat</SelectItem>
                    <SelectItem value="government">Pemerintah</SelectItem>
                    <SelectItem value="individual">Perorangan</SelectItem>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="picEmail">Email PIC</Label>
                  <Input
                    id="picEmail"
                    type="email"
                    value={form.picEmail}
                    onChange={(e) => setForm({ ...form, picEmail: e.target.value })}
                    placeholder="Alamat email PIC"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan / Deskripsi Singkat</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan atau keterangan industri (tampil di landing page)"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                ) : (
                  editing ? 'Perbarui Klien' : 'Buat Klien'
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
            <AlertDialogTitle>Hapus Klien</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleting?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              {deleting && (deleting._count?.projects ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  Klien ini memiliki {deleting._count?.projects} proyek terkait.
                </span>
              )}
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
