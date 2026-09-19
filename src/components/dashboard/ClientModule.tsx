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
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{client.email || '—'}</p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          typeColors[client.type] || ''
                        }`}
                      >
                        {typeLabels[client.type] || client.type}
                      </span>
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
                        <TableHead>Nama</TableHead>
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
                          <TableCell>
                            <div className="font-medium text-foreground">{client.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email || '—'}</div>
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
