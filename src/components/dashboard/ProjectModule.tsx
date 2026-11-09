'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  Search,
  Loader2,
  FolderKanban,
  ChevronRight,
  Trash2,
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
} from 'lucide-react'
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

const statusBadges: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
  },
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
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  const handleOpenEdit = async (projectId: string) => {
    try {
      setLoadingEditId(projectId)
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setProjectToEdit(data.data)
        setFormOpen(true)
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal memuat data proyek', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal mengambil detail proyek untuk diedit', variant: 'destructive' })
    } finally {
      setLoadingEditId(null)
    }
  }

  // Delete & Archive State
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null)

  const handleDownloadZip = (projectId: string, projectName: string) => {
    setDownloadingZipId(projectId)
    toast({
      title: 'Menyiapkan Arsip ZIP',
      description: `Mengompres file proyek ${projectName}...`,
    })
    const link = document.createElement('a')
    link.href = `/api/projects/${projectId}/export-archive`
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloadingZipId(null), 2500)
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Proyek Dihapus',
          description:
            data.message ||
            'Proyek dan seluruh file terkait di Supabase Storage telah dibersihkan.',
        })
        fetchProjects()
      } else {
        toast({
          title: 'Gagal Menghapus Proyek',
          description: data.error || 'Terjadi kesalahan saat menghapus proyek',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
      setProjectToDelete(null)
    }
  }

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
  }, [search, filterType, filterStatus, toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleProjectCreated = () => {
    setFormOpen(false)
    fetchProjects()
  }

  const kpi = useMemo(() => {
    const total = projects.length
    const active = projects.filter((p) => p.status === 'IN_PROGRESS').length
    const completed = projects.filter((p) => p.status === 'COMPLETED').length
    const draft = projects.filter((p) => p.status === 'DRAFT').length
    return { total, active, completed, draft }
  }, [projects])

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
      {/* ===== KUSALE 3 KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Total Proyek</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.total}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]">
              {kpi.active} Aktif
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#E6F8F3] dark:bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Proyek Selesai</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.completed}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400">
              Completed ▲
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#F97316] dark:text-orange-400" />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground mt-4">Draft & Perencanaan</p>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            <p className="text-[28px] sm:text-[30px] font-extrabold text-foreground tracking-tight leading-none">
              {kpi.draft} Items
            </p>
          </div>
        </div>
      </div>

      {/* ===== KUSALE TOOLBAR ===== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Segmented Status Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto max-w-full">
          {[
            { key: 'all', label: 'All Projects' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'DRAFT', label: 'Draft' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => {
            const active = filterStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search, Type Select & New Project Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card text-[13px]">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="PENGADAAN">Pengadaan</SelectItem>
              <SelectItem value="JASA">Jasa</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => {
              setProjectToEdit(null)
              setFormOpen(true)
            }}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* ===== KUSALE TABLE ===== */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Belum ada proyek ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Buat proyek baru atau ubah filter pencarian di atas.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border">
              {projects.map((project) => {
                const st = statusBadges[project.status] || statusBadges.DRAFT
                return (
                  <div key={project.id} className="w-full p-4 space-y-3">
                    <div
                      onClick={() => setSelectedProjectId(project.id)}
                      className="cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary">{project.projectCode}</p>
                          <p className="font-bold text-sm text-foreground mt-0.5">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {project.client?.name || '—'}
                            {project.poNumber && ` · PO: ${project.poNumber}`}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t border-border/60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={downloadingZipId === project.id}
                        onClick={() => handleDownloadZip(project.id, project.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        {downloadingZipId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Archive className="w-3.5 h-3.5 text-primary" />
                        )}
                        Unduh ZIP
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectId(project.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={loadingEditId === project.id}
                          onClick={() => handleOpenEdit(project.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit Proyek"
                        >
                          {loadingEditId === project.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Edit className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectToDelete(project)
                            setDeleteOpen(true)
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="whitespace-nowrap">
                <TableHeader>
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-bold text-[13px] text-foreground">
                      Project Name
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Code / PO
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Client
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Type
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Items
                    </TableHead>
                    <TableHead className="py-4 font-bold text-[13px] text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="py-4 pr-6 text-right font-bold text-[13px] text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const st = statusBadges[project.status] || statusBadges.DRAFT
                    return (
                      <TableRow
                        key={project.id}
                        className="border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                              <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[13.5px] text-foreground truncate max-w-[260px]">
                                {project.name}
                              </p>
                              <p className="text-[12px] text-muted-foreground mt-0.5">
                                {project.poNumber ? `PO: ${project.poNumber}` : 'Tanpa Nomor PO'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-[13px] font-semibold text-primary">
                            {project.projectCode}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-[13px] font-medium text-muted-foreground">
                          {project.client?.name || '—'}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
                            {project.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-[13.5px] text-foreground">
                          {project._count?.items ?? 0}
                        </TableCell>
                        <TableCell className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${st.className}`}
                          >
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell
                          className="py-4 pr-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              disabled={downloadingZipId === project.id}
                              onClick={() => handleDownloadZip(project.id, project.name)}
                              className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors"
                              title="Download arsip proyek (.zip)"
                            >
                              {downloadingZipId === project.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Archive className="w-3.5 h-3.5 text-primary" />
                              )}
                              <span className="hidden xl:inline">ZIP</span>
                            </button>
                            <button
                              onClick={() => setSelectedProjectId(project.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Buka Detail Proyek"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              disabled={loadingEditId === project.id}
                              onClick={() => handleOpenEdit(project.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit Proyek"
                            >
                              {loadingEditId === project.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              ) : (
                                <Edit className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setProjectToDelete(project)
                                setDeleteOpen(true)
                              }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Proyek"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Confirm: Hapus Proyek */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Hapus Proyek & File Terkait
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2.5 text-sm text-foreground/80">
                <div>
                  Apakah Anda yakin ingin menghapus proyek{' '}
                  <strong>{projectToDelete?.name}</strong> ({projectToDelete?.projectCode})?
                </div>
                <div className="p-3.5 bg-[#FFEFEF] dark:bg-rose-500/10 border border-rose-300/60 dark:border-rose-500/20 rounded-xl text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="font-bold">⚠️ PEMBERSIHAN DATA & BUCKET STORAGE:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>
                      Semua file proyek di Supabase Storage (PO, Invoice, RAB, Surat Jalan, bukti
                      transfer, dll) akan <strong>dihapus permanen dari bucket</strong>.
                    </li>
                    <li>
                      Semua item, invoice, kuitansi, dan realisasi RAB proyek akan dihapus dari
                      database.
                    </li>
                    <li>
                      Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                await handleDeleteProject()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Menghapus & Membersihkan Bucket...
                </>
              ) : (
                'Hapus Proyek & File'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setProjectToEdit(null)
        }}
        onCreated={handleProjectCreated}
        projectToEdit={projectToEdit}
        onUpdated={fetchProjects}
      />
    </div>
  )
}
