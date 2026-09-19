'use client'

import { useState, useEffect } from 'react'
import {
  Images,
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoveUp,
  MoveDown,
  MessageSquareQuote,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface GalleryItem {
  id: string
  title: string
  comment: string | null
  imageUrl: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface GalleryModuleProps {
  isEmbedded?: boolean
}

export default function GalleryModule({ isEmbedded = false }: GalleryModuleProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data)
      }
    } catch (err) {
      console.error('Error fetching gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setTitle('')
    setComment('')
    setImageUrl('')
    setSortOrder(items.length)
    setIsActive(true)
    setFormError('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: GalleryItem) => {
    setEditId(item.id)
    setTitle(item.title)
    setComment(item.comment || '')
    setImageUrl(item.imageUrl)
    setSortOrder(item.sortOrder)
    setIsActive(item.isActive)
    setFormError('')
    setModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setFormError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.url) {
        setImageUrl(data.url)
      } else {
        setFormError(data.error || 'Gagal mengunggah foto.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setFormError('Terjadi kesalahan saat mengunggah foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError('Judul proyek wajib diisi.')
      return
    }

    if (!imageUrl.trim()) {
      setFormError('Foto proyek wajib diunggah atau diisi URL.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        comment: comment.trim() || null,
        imageUrl: imageUrl.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive,
      }

      const url = editId ? `/api/gallery/${editId}` : '/api/gallery'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        fetchItems()
      } else {
        setFormError(data.error || 'Gagal menyimpan data galeri.')
      }
    } catch (err) {
      console.error('Save error:', err)
      setFormError('Terjadi kesalahan saat menyimpan data.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Hapus foto galeri "${itemTitle}"?`)) return

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchItems()
      } else {
        alert(data.error || 'Gagal menghapus item.')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Terjadi kesalahan saat menghapus item.')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Images className="w-6 h-6 text-primary" />
              Galeri Rekam Jejak Pengiriman Proyek
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola foto dokumentasi pengiriman proyek, judul, dan komentar yang tampil di carousel 2 kolom Landing Page.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Foto Galeri
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                Daftar Foto Dokumentasi ({items.length})
              </CardTitle>
              <CardDescription>
                Item dengan status Aktif akan otomatis tampil pada carousel rekam jejak di landing page.
              </CardDescription>
            </div>
            <Button onClick={handleOpenAdd} size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Foto Galeri
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Memuat galeri...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Images className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">Belum ada foto galeri</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Tambahkan dokumentasi pengiriman barang, instalasi server, atau proyek instansi Anda untuk ditampilkan di landing page.
              </p>
              <Button onClick={handleOpenAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Foto Pertama
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] py-0">
                            Urutan #{item.sortOrder}
                          </Badge>
                          {item.isActive ? (
                            <Badge className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              Non-Aktif
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm line-clamp-2 break-words leading-snug">{item.title}</h4>
                        {item.comment && (
                          <p className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere] mt-1.5 italic leading-relaxed">
                            &ldquo;{item.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View with strict table-fixed and word wrap */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="w-full table-fixed min-w-[700px]">
                  <colgroup>
                    <col className="w-20" />
                    <col className="w-48" />
                    <col className="w-auto" />
                    <col className="w-20" />
                    <col className="w-24" />
                    <col className="w-24" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Foto</TableHead>
                      <TableHead className="w-48">Judul Proyek</TableHead>
                      <TableHead>Komentar / Keterangan</TableHead>
                      <TableHead className="text-center w-20">Urutan</TableHead>
                      <TableHead className="text-center w-24">Status</TableHead>
                      <TableHead className="text-right w-24">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="align-top py-3.5">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border relative group shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="align-top py-3.5 font-semibold text-sm break-words whitespace-normal leading-snug">
                          {item.title}
                        </TableCell>
                        <TableCell className="align-top py-3.5 text-xs text-muted-foreground leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere]">
                          {item.comment ? (
                            <div className="flex items-start gap-1.5 italic whitespace-normal break-words">
                              <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <p className="whitespace-normal break-words [overflow-wrap:anywhere] leading-relaxed">
                                {item.comment}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top py-3.5 text-center">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.sortOrder}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top py-3.5 text-center">
                          {item.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Non-Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-top py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit item"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.title)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Hapus item"
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah / Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" />
              {editId ? 'Edit Foto Galeri Proyek' : 'Tambah Foto Galeri Proyek'}
            </DialogTitle>
            <DialogDescription>
              Informasi ini akan ditampilkan pada infinite slide di Landing Page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Foto upload & preview */}
            <div className="space-y-2">
              <Label>Foto Dokumentasi Proyek</Label>
              <div className="space-y-3">
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border bg-muted aspect-video max-h-48 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(imageUrl, '_blank')}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Lihat Penuh
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setImageUrl('')}
                      >
                        Ganti Foto
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">Unggah foto dari perangkat</p>
                    <p className="text-xs text-muted-foreground mb-3">PNG, JPG, WEBP (Maks 5MB)</p>
                    <div className="flex justify-center">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                          {uploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Mengunggah...
                            </>
                          ) : (
                            'Pilih File Foto'
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Input URL alternatif */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Atau masukkan URL gambar langsung:</Label>
                  <Input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/foto-proyek.jpg"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Judul Proyek */}
            <div className="space-y-2">
              <Label htmlFor="itemTitle">Judul Proyek / Pengiriman *</Label>
              <Input
                id="itemTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengadaan & Instalasi Server Dinas Kominfo"
                required
              />
            </div>

            {/* Komentar / Testimoni */}
            <div className="space-y-2">
              <Label htmlFor="itemComment">Komentar / Keterangan Proyek</Label>
              <textarea
                id="itemComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contoh: Pengiriman 50 unit PC, server rack, dan instalasi sistem UPS selesai sesuai target SLA dengan hasil prima."
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Urutan */}
              <div className="space-y-2">
                <Label htmlFor="itemSort">Nomor Urutan Tampil</Label>
                <Input
                  id="itemSort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              {/* Status Aktif */}
              <div className="space-y-2">
                <Label>Status Tampil</Label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="itemIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="itemIsActive" className="text-xs cursor-pointer">
                    Tampilkan di Landing Page
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting || uploading}>
                {submitting ? 'Menyimpan...' : 'Simpan Foto Galeri'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
