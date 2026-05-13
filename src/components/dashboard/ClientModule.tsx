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
  corporate: 'Corporate',
  government: 'Government',
  individual: 'Individual',
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
      toast({ title: 'Error', description: 'Failed to fetch clients', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
      toast({ title: 'Validation Error', description: 'Name is required', variant: 'destructive' })
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
          title: editing ? 'Client Updated' : 'Client Created',
          description: `${form.name} has been ${editing ? 'updated' : 'created'} successfully.`,
        })
        setFormOpen(false)
        fetchClients()
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
      const res = await fetch(`/api/clients/${deleting.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Client Deleted', description: `${deleting.name} has been deleted.` })
        setDeleteOpen(false)
        setDeleting(null)
        fetchClients()
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
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your client directory</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
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
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">PIC</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Projects</TableHead>
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
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {search ? 'No clients match your search.' : 'No clients yet. Create your first client!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
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
            <DialogTitle>{editing ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update client information' : 'Create a new client record'}
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
                  placeholder="Client name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="picEmail">PIC Email</Label>
                  <Input
                    id="picEmail"
                    type="email"
                    value={form.picEmail}
                    onChange={(e) => setForm({ ...form, picEmail: e.target.value })}
                    placeholder="PIC email address"
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
                  editing ? 'Update Client' : 'Create Client'
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
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.
              {deleting && (deleting._count?.projects ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  This client has {deleting._count?.projects} project(s) associated.
                </span>
              )}
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
