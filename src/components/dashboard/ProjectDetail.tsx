'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Package,
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  MessageSquare,
  Calculator,
  Badge as BadgeIcon,
  Edit,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SuratJalanForm,
  BASTForm,
  InvoiceForm,
  KuitansiForm,
} from './DocumentFormDialogs'
import { useToast } from '@/hooks/use-toast'

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  // RAB Purchase dialog
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [purchaseForm, setPurchaseForm] = useState({ vendorId: '', qty: '1', buyPrice: '0', docUrl: '', notes: '' })
  const [vendors, setVendors] = useState<any[]>([])
  const [submittingPurchase, setSubmittingPurchase] = useState(false)

  // Additional cost dialog
  const [addCostOpen, setAddCostOpen] = useState(false)
  const [addCostForm, setAddCostForm] = useState({ category: 'ACCESSORIES', description: '', amount: '0', vendorId: '', notes: '' })
  const [submittingCost, setSubmittingCost] = useState(false)

  // Progress note
  const [noteContent, setNoteContent] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Document dialogs
  const [sjFormOpen, setSjFormOpen] = useState(false)
  const [bastFormOpen, setBastFormOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [kuitansiFormOpen, setKuitansiFormOpen] = useState(false)

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success) setProject(data.data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch project', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  useEffect(() => {
    if (purchaseOpen || addCostOpen) {
      fetch('/api/vendors')
        .then((r) => r.json())
        .then((data) => { if (data.success) setVendors(data.data) })
        .catch(() => {})
    }
  }, [purchaseOpen, addCostOpen])

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPurchase(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/rab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectItemId: selectedItemId,
          vendorId: purchaseForm.vendorId || null,
          qty: parseFloat(purchaseForm.qty) || 0,
          buyPrice: parseFloat(purchaseForm.buyPrice) || 0,
          docUrl: purchaseForm.docUrl || null,
          notes: purchaseForm.notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Purchase Added', description: 'RAB purchase has been recorded.' })
        setPurchaseOpen(false)
        setPurchaseForm({ vendorId: '', qty: '1', buyPrice: '0', docUrl: '', notes: '' })
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingPurchase(false)
    }
  }

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCost(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/additional-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: addCostForm.category,
          description: addCostForm.description,
          amount: parseFloat(addCostForm.amount) || 0,
          vendorId: addCostForm.vendorId || null,
          notes: addCostForm.notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Cost Added', description: 'Additional cost has been recorded.' })
        setAddCostOpen(false)
        setAddCostForm({ category: 'ACCESSORIES', description: '', amount: '0', vendorId: '', notes: '' })
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingCost(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setSubmittingNote(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Note Added' })
        setNoteContent('')
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Status Updated', description: `Project status changed to ${newStatus}` })
        fetchProject()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    )
  }

  // Calculate Laba/Rugi
  const poTotal = project.items?.reduce((s: number, i: any) => s + i.total, 0) || 0
  const totalPurchases = project.items?.reduce(
    (s: number, i: any) => s + (i.purchases?.reduce((ps: number, p: any) => ps + p.totalBuy, 0) || 0),
    0
  ) || 0
  const totalAddCosts = project.additionalCosts?.reduce((s: number, c: any) => s + c.amount, 0) || 0
  const totalCost = totalPurchases + totalAddCosts
  const profit = poTotal - totalCost

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge variant="outline" className="text-[10px]">{project.projectCode}</Badge>
            <Badge variant="outline" className="text-[10px]">{project.type}</Badge>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColors[project.status] || ''}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Client: {project.client?.name || '—'} · PO: {project.poNumber || '—'}
          </p>
        </div>
        <div className="flex gap-2">
          {project.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={statusUpdating}>
              Start Project
            </Button>
          )}
          {project.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => handleStatusUpdate('COMPLETED')} disabled={statusUpdating}>
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info"><FileText className="w-3.5 h-3.5 mr-1.5" />Info</TabsTrigger>
          <TabsTrigger value="rab"><Package className="w-3.5 h-3.5 mr-1.5" />RAB</TabsTrigger>
          <TabsTrigger value="documents"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Documents</TabsTrigger>
        </TabsList>

        {/* ─── TAB: INFO ─── */}
        <TabsContent value="info" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Project Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Project Code:</span><p className="font-medium">{project.projectCode}</p></div>
                  <div><span className="text-muted-foreground">Type:</span><p className="font-medium">{project.type}</p></div>
                  <div><span className="text-muted-foreground">PO Number:</span><p className="font-medium">{project.poNumber || '—'}</p></div>
                  <div><span className="text-muted-foreground">Internal PIC:</span><p className="font-medium">{project.internalPic || '—'}</p></div>
                  <div><span className="text-muted-foreground">Start Date:</span><p className="font-medium">{formatDate(project.startDate)}</p></div>
                  <div><span className="text-muted-foreground">End Date:</span><p className="font-medium">{formatDate(project.endDate)}</p></div>
                </div>
                <Separator />
                <div><span className="text-muted-foreground">Client:</span><p className="font-medium">{project.client?.name}</p></div>
                <div><span className="text-muted-foreground">Client PIC:</span><p className="font-medium">{project.clientPicName || '—'} {project.clientPicPhone ? `· ${project.clientPicPhone}` : ''}</p></div>
                {project.clientAddress && <div><span className="text-muted-foreground">Address:</span><p className="font-medium">{project.clientAddress}</p></div>}
                {project.notes && <div><span className="text-muted-foreground">Notes:</span><p className="font-medium whitespace-pre-wrap">{project.notes}</p></div>}
              </CardContent>
            </Card>

            {/* Laba Rugi Calculator */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Laba / Rugi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PO Total (RAB)</span>
                  <span className="font-medium">{formatCurrency(poTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Purchases</span>
                  <span className="font-medium text-destructive">- {formatCurrency(totalPurchases)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Additional Costs</span>
                  <span className="font-medium text-destructive">- {formatCurrency(totalAddCosts)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>{profit >= 0 ? 'Laba (Profit)' : 'Rugi (Loss)'}</span>
                  <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatCurrency(profit)}
                  </span>
                </div>
                {poTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Margin</span>
                    <span>{((profit / poTotal) * 100).toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Progress Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a progress note..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={submittingNote || !noteContent.trim()}
                  className="self-end"
                >
                  {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                </Button>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {(project.progressNotes || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                  ) : (
                    project.progressNotes.map((note: any) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {note.createdBy || 'Staff'} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: RAB ─── */}
        <TabsContent value="rab" className="space-y-6 mt-4">
          {/* Items with purchases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">RAB Items & Purchases</CardTitle>
              <CardDescription>Track purchase costs for each item</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Sell Price</TableHead>
                      <TableHead className="text-right">Total RAB</TableHead>
                      <TableHead className="text-right">Total Buy</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(project.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No items in this project
                        </TableCell>
                      </TableRow>
                    ) : (
                      project.items.map((item: any) => {
                        const itemBuyTotal = item.purchases?.reduce((s: number, p: any) => s + p.totalBuy, 0) || 0
                        const margin = item.total - itemBuyTotal
                        return (
                          <>
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-foreground text-sm">{item.itemName}</div>
                                <div className="text-[10px] text-muted-foreground">{item.itemId}</div>
                              </TableCell>
                              <TableCell className="text-right text-sm">{item.qty} {item.unit}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right text-sm font-medium">{formatCurrency(item.total)}</TableCell>
                              <TableCell className="text-right text-sm font-medium text-destructive">{formatCurrency(itemBuyTotal)}</TableCell>
                              <TableCell className={`text-right text-sm font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(margin)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedItemId(item.id)
                                    setPurchaseOpen(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Buy
                                </Button>
                              </TableCell>
                            </TableRow>
                            {/* Purchase details */}
                            {item.purchases?.length > 0 && (
                              <TableRow key={`${item.id}-purchases`} className="bg-muted/20">
                                <TableCell colSpan={7} className="p-2">
                                  <div className="pl-6 space-y-1">
                                    {item.purchases.map((p: any) => (
                                      <div key={p.id} className="flex items-center gap-3 text-xs text-muted-foreground py-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        <span>{p.vendor?.name || 'No vendor'}</span>
                                        <span>× {p.qty} @ {formatCurrency(p.buyPrice)}</span>
                                        <span className="font-medium text-foreground">= {formatCurrency(p.totalBuy)}</span>
                                        {p.docUrl && (
                                          <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            [doc]
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Additional Costs</CardTitle>
                  <CardDescription>Accessories, shipping, operational, etc.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAddCostOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Cost
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.additionalCosts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No additional costs</p>
              ) : (
                <div className="space-y-2">
                  {project.additionalCosts.map((cost: any) => (
                    <div key={cost.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cost.category}</Badge>
                          <span className="text-sm font-medium text-foreground">{cost.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cost.vendor?.name || 'No vendor'}
                          {cost.notes && ` · ${cost.notes}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-destructive">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Total Additional Costs</span>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(totalAddCosts)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RAB Purchase Dialog */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Purchase</DialogTitle>
                <DialogDescription>Record a purchase for this item</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPurchase} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={purchaseForm.vendorId} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, vendorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qty</Label>
                    <Input type="number" min="0" value={purchaseForm.qty} onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Buy Price</Label>
                    <Input type="number" min="0" value={purchaseForm.buyPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Document URL</Label>
                  <Input value={purchaseForm.docUrl} onChange={(e) => setPurchaseForm({ ...purchaseForm, docUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="Optional notes" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setPurchaseOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submittingPurchase}>
                    {submittingPurchase ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Add Purchase
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Additional Cost Dialog */}
          <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Additional Cost</DialogTitle>
                <DialogDescription>Record an extra cost for this project</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCost} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={addCostForm.category} onValueChange={(v) => setAddCostForm({ ...addCostForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                      <SelectItem value="SHIPPING">Shipping</SelectItem>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input value={addCostForm.description} onChange={(e) => setAddCostForm({ ...addCostForm, description: e.target.value })} placeholder="Description" required />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" min="0" value={addCostForm.amount} onChange={(e) => setAddCostForm({ ...addCostForm, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={addCostForm.vendorId} onValueChange={(v) => setAddCostForm({ ...addCostForm, vendorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vendor (optional)" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={addCostForm.notes} onChange={(e) => setAddCostForm({ ...addCostForm, notes: e.target.value })} placeholder="Optional notes" />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setAddCostOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submittingCost}>
                    {submittingCost ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Add Cost
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── TAB: DOCUMENTS ─── */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Surat Jalan */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Surat Jalan</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSjFormOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.suratJalans || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No surat jalan yet</p>
              ) : (
                <div className="space-y-2">
                  {project.suratJalans.map((sj: any) => (
                    <div key={sj.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{sj.sjNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(sj.date)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{sj.type}</Badge>
                      </div>
                      {sj.items?.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {sj.items.map((item: any, i: number) => (
                            <div key={i}>{item.description} × {item.qty} {item.unit}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BAST */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">BAST</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setBastFormOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.basts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No BAST yet</p>
              ) : (
                <div className="space-y-2">
                  {project.basts.map((bast: any) => (
                    <div key={bast.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{bast.bastNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(bast.date)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{bast.type}</Badge>
                      </div>
                      {bast.items?.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          {bast.items.map((item: any, i: number) => (
                            <div key={i}>{item.description} × {item.qty} {item.unit}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Invoices</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setInvoiceFormOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.invoices || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {project.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{inv.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(inv.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{inv.paymentMethod}</Badge>
                          <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px]">{inv.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-medium">{formatCurrency(inv.items?.reduce((s: number, i: any) => s + i.amount, 0) || 0)}</div>
                      {inv.termins?.length > 0 && (
                        <div className="mt-2 text-xs space-y-1">
                          {inv.termins.map((t: any) => (
                            <div key={t.id} className="flex items-center gap-2 text-muted-foreground">
                              <span>Termin {t.terminNo}: {t.percentage}% = {formatCurrency(t.amount)}</span>
                              <Badge variant={t.status === 'PAID' ? 'default' : 'outline'} className="text-[9px] px-1 py-0">{t.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kuitansi */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Kuitansi</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setKuitansiFormOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(project.kuitansis || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No kuitansi yet</p>
              ) : (
                <div className="space-y-2">
                  {project.kuitansis.map((k: any) => (
                    <div key={k.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">{k.kuitansiNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDate(k.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{k.paymentMethod}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-medium">{formatCurrency(k.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Form Dialogs */}
      {project && (
        <>
          <SuratJalanForm
            open={sjFormOpen}
            onOpenChange={setSjFormOpen}
            projectId={projectId}
            projectType={project.type}
            projectItems={project.items || []}
            onCreated={fetchProject}
          />
          <BASTForm
            open={bastFormOpen}
            onOpenChange={setBastFormOpen}
            projectId={projectId}
            projectType={project.type}
            suratJalans={project.suratJalans || []}
            onCreated={fetchProject}
          />
          <InvoiceForm
            open={invoiceFormOpen}
            onOpenChange={setInvoiceFormOpen}
            projectId={projectId}
            projectItems={project.items || []}
            onCreated={fetchProject}
          />
          <KuitansiForm
            open={kuitansiFormOpen}
            onOpenChange={setKuitansiFormOpen}
            projectId={projectId}
            invoices={project.invoices || []}
            basts={project.basts || []}
            onCreated={fetchProject}
          />
        </>
      )}
    </div>
  )
}
