'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  Users,
  Building2,
  FileText,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ModuleKey } from './DashboardLayout'

interface DashboardHomeProps {
  staff: {
    id: string
    name: string
    username: string
    role: string
    avatar: string | null
  }
  onNavigate: (module: ModuleKey) => void
}

interface DashboardStats {
  activeProjects: number
  totalClients: number
  totalVendors: number
  pendingInvoices: number
}

interface RecentProject {
  id: string
  projectCode: string
  name: string
  type: string
  status: string
  client: { id: string; name: string }
  createdAt: string
}

export default function DashboardHome({ staff, onNavigate }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/projects?limit=5'),
        ])

        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats({
            activeProjects: statsData.stats?.activeProjects ?? 0,
            totalClients: statsData.stats?.totalClients ?? 0,
            totalVendors: statsData.stats?.totalVendors ?? 0,
            pendingInvoices: statsData.stats?.pendingInvoices ?? 0,
          })
        }

        const projectsData = await projectsRes.json()
        if (projectsData.success) {
          setRecentProjects(projectsData.data ?? [])
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      icon: FolderKanban,
      label: 'Active Projects',
      value: stats?.activeProjects ?? '—',
      change: 'In progress',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: 'Total Clients',
      value: stats?.totalClients ?? '—',
      change: 'Registered',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Building2,
      label: 'Total Vendors',
      value: stats?.totalVendors ?? '—',
      change: 'Active suppliers',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: FileText,
      label: 'Pending Invoices',
      value: stats?.pendingInvoices ?? '—',
      change: 'Awaiting payment',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ]

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-primary/10 text-primary',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
  }

  const quickActions = [
    { label: 'New Project', icon: FolderKanban, module: 'projects' as ModuleKey },
    { label: 'Add Client', icon: Users, module: 'clients' as ModuleKey },
    { label: 'Add Vendor', icon: Building2, module: 'vendors' as ModuleKey },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {staff.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Projects</CardTitle>
                  <CardDescription>Latest project activity</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('projects')}
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No projects yet. Create your first project!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => onNavigate('projects')}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.projectCode} · {project.client?.name || 'No client'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {project.type}
                        </Badge>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.module)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary ml-auto transition-colors shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Pro Tip</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the sidebar to navigate between modules. Click on a project to view its details,
                RAB, and documents.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
