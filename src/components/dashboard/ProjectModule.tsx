'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Loader2,
  Filter,
  FolderKanban,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import ProjectForm from './ProjectForm'
import ProjectDetail from './ProjectDetail'
import { useToast } from '@/hooks/use-toast'

interface ProjectListItem {
  id: string
  projectCode: string
  name: string
  type: string
  status: string
  poNumber: string | null
  client: { id: string; name: string; picName: string | null; phone: string | null }
  _count: { items: number }
  createdAt: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export default function ProjectModule() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/projects?${params.toString()}`)
      const data = await res.json()
      if (data.success) setProjects(data.data)
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat proyek', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterStatus])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleProjectCreated = () => {
    setFormOpen(false)
    fetchProjects()
  }

  // If a project is selected, show ProjectDetail
  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => {
          setSelectedProjectId(null)
          fetchProjects()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Proyek</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelola semua proyek</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Proyek Baru
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Daftar Proyek</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari proyek..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="PENGADAAN">Pengadaan</SelectItem>
                  <SelectItem value="JASA">Jasa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">Berjalan</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 mt-4 sm:mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
              <p className="font-medium text-foreground">Belum ada proyek</p>
              <p className="text-sm">Buat proyek pertama Anda untuk memulai.</p>
            </div>
          ) : (
            <>
              {/* ===== MOBILE: Card list ===== */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className="w-full text-left p-4 space-y-3 active:bg-muted/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project.projectCode}
                          {project.poNumber && ` · PO: ${project.poNumber}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] || ''}`}>
                        {statusLabels[project.status] || project.status}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {project.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="text-muted-foreground">Klien</p>
                        <p className="truncate mt-0.5">{project.client?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Item</p>
                        <p className="mt-0.5">
                          <Badge variant="secondary" className="text-[11px]">
                            {project._count?.items ?? 0}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* ===== DESKTOP: Tabel ===== */}
              <div className="hidden md:block border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Proyek</TableHead>
                        <TableHead className="hidden md:table-cell">Tipe</TableHead>
                        <TableHead className="hidden sm:table-cell">Klien</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Item</TableHead>
                        <TableHead className="text-right">Lihat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-primary/5"
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <TableCell>
                            <div className="font-medium text-foreground">{project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.projectCode}
                              {project.poNumber && ` · PO: ${project.poNumber}`}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {project.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {project.client?.name || '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] || ''}`}>
                              {statusLabels[project.status] || project.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary" className="text-[11px]">
                              {project._count?.items ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
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

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  )
}
