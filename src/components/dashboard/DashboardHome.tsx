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
  ShoppingCart,
  Wrench,
  Wallet,
  Coins
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

interface AdvancedStats {
  transactions: { today: number; thisMonth: number }
  services: { process: number; pending: number; success: number }
  balanceThisMonth: number
  pettyCashBalance: number
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
  const [advStats, setAdvStats] = useState<AdvancedStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const [statsRes, advStatsRes, projectsRes] = await Promise.all([
          fetch('/api/projects/stats'),
          fetch('/api/dashboard/stats'),
          fetch('/api/projects?limit=5'),
        ])

        const statsData = await statsRes.json()
        if (!cancelled && statsData.success) {
          setStats({
            activeProjects: statsData.stats?.activeProjects ?? 0,
            totalClients: statsData.stats?.totalClients ?? 0,
            totalVendors: statsData.stats?.totalVendors ?? 0,
            pendingInvoices: statsData.stats?.pendingInvoices ?? 0,
          })
        }

        const advStatsData = await advStatsRes.json()
        if (!cancelled && !advStatsData.error) {
          setAdvStats(advStatsData)
        }

        const projectsData = await projectsRes.json()
        if (!cancelled && projectsData.success) {
          setRecentProjects(projectsData.data ?? [])
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const statCards = [
    {
      icon: FolderKanban,
      label: 'Proyek Aktif',
      value: stats?.activeProjects ?? '—',
      change: 'Berjalan',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: 'Total Klien',
      value: stats?.totalClients ?? '—',
      change: 'Terdaftar',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Building2,
      label: 'Total Vendor',
      value: stats?.totalVendors ?? '—',
      change: 'Supplier aktif',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: FileText,
      label: 'Invoice Tertunda',
      value: stats?.pendingInvoices ?? '—',
      change: 'Menunggu pembayaran',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const businessCards = [
    {
      icon: ShoppingCart,
      label: 'Transaksi POS',
      value: advStats?.transactions.today ?? 0,
      change: `${advStats?.transactions.thisMonth ?? 0} bulan ini`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      module: 'transactions' as ModuleKey,
    },
    {
      icon: Wrench,
      label: 'Service Aktif',
      value: advStats?.services.process ?? 0,
      change: `${advStats?.services.success ?? 0} Selesai, ${advStats?.services.pending ?? 0} Pending`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      module: 'services' as ModuleKey,
    },
    {
      icon: Wallet,
      label: 'Saldo Bulan Ini',
      value: advStats ? formatCurrency(advStats.balanceThisMonth) : '—',
      change: 'Total Pemasukan',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      module: 'finance' as ModuleKey,
    },
    {
      icon: Coins,
      label: 'Kas Kecil',
      value: advStats ? formatCurrency(advStats.pettyCashBalance) : '—',
      change: 'Saldo saat ini',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      module: 'finance' as ModuleKey,
    },
  ]

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-primary/10 text-primary',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-rose-50 text-rose-700',
  }

  const quickActions = [
    { label: 'Proyek Baru', icon: FolderKanban, module: 'projects' as ModuleKey },
    { label: 'Transaksi Baru', icon: ShoppingCart, module: 'transactions' as ModuleKey },
    { label: 'Terima Service', icon: Wrench, module: 'services' as ModuleKey },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Selamat datang, {staff.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Berikut ringkasan aktivitas perusahaan Anda hari ini.
        </p>
      </motion.div>

      {/* Business Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {businessCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="cursor-pointer"
            onClick={() => onNavigate(stat.module)}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Project Stats cards */}
      <h2 className="text-lg font-semibold text-foreground">Ringkasan Proyek</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
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
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Proyek Terbaru</CardTitle>
                  <CardDescription>Aktivitas proyek terbaru</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('projects')}
                >
                  Lihat Semua
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentProjects.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                  <p className="font-medium text-foreground">Belum ada proyek</p>
                  <p className="text-sm">Buat proyek pertama Anda untuk memulai.</p>
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
                          {project.projectCode} · {project.client?.name || 'Tidak ada klien'}
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
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
              <CardDescription>Pintasan menu</CardDescription>
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
                <h3 className="font-semibold text-foreground text-sm">Tips</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gunakan menu di sidebar untuk berpindah antar modul dengan cepat. Anda juga dapat menggunakan pintasan Aksi Cepat untuk tugas sehari-hari.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
