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
import { Card, CardContent } from '@/components/ui/card'
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
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
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
      toast({ title: 'Error', description: 'Failed to fetch projects', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterType, filterStatus, toast])

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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all projects</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PENGADAAN">Pengadaan</SelectItem>
            <SelectItem value="JASA">Jasa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No projects found. Create your first project!
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
