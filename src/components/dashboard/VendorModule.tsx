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
import { Card, CardContent } from '@/components/ui/card'
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
  contractor: 'Contractor',
  'service-provider': 'Service Provider',
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
      toast({ title: 'Error', description: 'Failed to fetch vendors', variant: 'destructive' })
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
      toast({ title: 'Validation Error', description: 'Name is required', variant: 'destructive' })
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
          title: editing ? 'Vendor Updated' : 'Vendor Created',
          description: `${form.name} has been ${editing ? 'updated' : 'created'} successfully.`,
        })
        setFormOpen(false)
        fetchVendors()
      } else {
        toast({ title: 'Error', description: data.error || 'Operation failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
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
        toast({ title: 'Vendor Deleted', description: `${deleting.name} has been deleted.` })
        setDeleteOpen(false)
        setDeleting(null)
        fetchVendors()
      } else {
        toast({ title: 'Error', description: data.error || 'Delete failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your vendor directory</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">PIC</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Bank</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {search ? 'No vendors match your search.' : 'No vendors yet. Create your first vendor!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update vendor information' : 'Create a new vendor record'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Vendor name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="service-provider">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-foreground mb-3">Person in Charge (PIC)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="picName">PIC Name</Label>
                  <Input
                    id="picName"
                    value={form.picName}
                    onChange={(e) => setForm({ ...form, picName: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="picPhone">PIC Phone</Label>
                  <Input
                    id="picPhone"
                    value={form.picPhone}
                    onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                    placeholder="PIC phone number"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-foreground mb-3">Bank Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    value={form.bankAccount}
                    onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bankHolder">Account Holder</Label>
                  <Input
                    id="bankHolder"
                    value={form.bankHolder}
                    onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  editing ? 'Update Vendor' : 'Create Vendor'
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
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
