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
  Coins,
  AlertTriangle,
  Package,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  unpaidVendorInvoices?: number
  totalHutangVendor?: number
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
  const [projectTab, setProjectTab] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const [statsRes, advStatsRes, projectsRes] = await Promise.all([
          fetch('/api/projects/stats'),
          fetch('/api/dashboard/stats'),
          fetch('/api/projects?limit=8'),
        ])

        const statsData = await statsRes.json()
        if (!cancelled && statsData.success) {
          setStats({
            activeProjects: statsData.stats?.activeProjects ?? 0,
            totalClients: statsData.stats?.totalClients ?? 0,
            totalVendors: statsData.stats?.totalVendors ?? 0,
            pendingInvoices: statsData.stats?.pendingInvoices ?? 0,
            unpaidVendorInvoices: statsData.stats?.unpaidVendorInvoices ?? 0,
            totalHutangVendor: statsData.stats?.totalHutangVendor ?? 0,
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
    return () => {
      cancelled = true
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Kusale Top KPI Cards (Primary Business Metrics)
  const businessCards = [
    {
      icon: ShoppingCart,
      label: 'Transaksi POS Hari Ini',
      value: advStats?.transactions.today ?? 0,
      badge: `${advStats?.transactions.thisMonth ?? 0} bln ini ▲`,
      iconBox: 'bg-[#EEF0FF] text-primary dark:bg-primary/15 dark:text-[#8190FF]',
      badgeClass:
        'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
      module: 'transactions' as ModuleKey,
    },
    {
      icon: Wallet,
      label: 'Pemasukan Bulan Ini',
      value: advStats ? formatCurrency(advStats.balanceThisMonth) : 'Rp 0',
      badge: 'Bulan Ini ▲',
      iconBox: 'bg-[#E6F8F3] text-[#10B981] dark:bg-emerald-500/15 dark:text-emerald-400',
      badgeClass:
        'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
      module: 'finance' as ModuleKey,
    },
    {
      icon: Wrench,
      label: 'Tiket Service Aktif',
      value: `${advStats?.services.process ?? 0} Items`,
      badge: `${advStats?.services.pending ?? 0} Pending`,
      iconBox: 'bg-[#FFF3E8] text-[#F97316] dark:bg-orange-500/15 dark:text-orange-400',
      badgeClass:
        'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]',
      module: 'services' as ModuleKey,
    },
  ]

  // Secondary Kusale KPI Cards (Projects, Clients, Vendors, Petty Cash)
  const statCards = [
    {
      icon: FolderKanban,
      label: 'Proyek Aktif',
      value: stats?.activeProjects ?? 0,
      badge: 'Berjalan',
      iconBox: 'bg-[#EEF0FF] text-primary dark:bg-primary/15 dark:text-[#8190FF]',
      badgeClass: 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]',
      module: 'projects' as ModuleKey,
    },
    {
      icon: Users,
      label: 'Total Klien',
      value: stats?.totalClients ?? 0,
      badge: 'Terdaftar',
      iconBox: 'bg-[#E6F8F3] text-[#10B981] dark:bg-emerald-500/15 dark:text-emerald-400',
      badgeClass: 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
      module: 'clients' as ModuleKey,
    },
    {
      icon: Building2,
      label: 'Total Vendor',
      value: stats?.totalVendors ?? 0,
      badge: 'Mitra Aktif',
      iconBox: 'bg-[#FFF3E8] text-[#F97316] dark:bg-orange-500/15 dark:text-orange-400',
      badgeClass: 'bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400',
      module: 'vendors' as ModuleKey,
    },
    {
      icon: FileText,
      label: 'Invoice Tertunda',
      value: stats?.pendingInvoices ?? 0,
      badge: 'Menunggu',
      iconBox: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
      badgeClass: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
      module: 'projects' as ModuleKey,
    },
  ]

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

  const quickActions = [
    { label: 'Kelola Stok Barang', desc: 'Cek & tambah produk baru', icon: Package, module: 'inventory' as ModuleKey },
    { label: 'Buat Proyek Baru', desc: 'Input proyek & RAB', icon: FolderKanban, module: 'projects' as ModuleKey },
    { label: 'Transaksi POS Baru', desc: 'Kasir penjualan langsung', icon: ShoppingCart, module: 'transactions' as ModuleKey },
    { label: 'Terima Tiket Service', desc: 'Input servis masuk', icon: Wrench, module: 'services' as ModuleKey },
  ]

  const filteredRecentProjects = recentProjects.filter((p) =>
    projectTab === 'ALL' ? true : p.status === projectTab
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===== TOP 3 KUSALE KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {businessCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.07 }}
            onClick={() => onNavigate(stat.module)}
            className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-primary/40 transition-all cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.iconBox} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground mt-4">{stat.label}</p>
            <div className="flex items-end justify-between gap-2 mt-1.5">
              <p className="text-[24px] sm:text-[28px] font-extrabold text-foreground tracking-tight leading-none truncate">
                {stat.value}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${stat.badgeClass}`}
              >
                {stat.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== SECONDARY 4 KUSALE KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + idx * 0.06 }}
            onClick={() => onNavigate(stat.module)}
            className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-primary/40 transition-all cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.iconBox} flex items-center justify-center`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-[12.5px] font-medium text-muted-foreground mt-3.5">{stat.label}</p>
            <div className="flex items-end justify-between gap-2 mt-1.5">
              <p className="text-[24px] font-extrabold text-foreground tracking-tight leading-none">
                {stat.value}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${stat.badgeClass}`}
              >
                {stat.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hutang Vendor Alert (Dark & Light friendly) */}
      {Boolean(stats?.unpaidVendorInvoices && stats.unpaidVendorInvoices > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#FFF4E5] dark:bg-amber-500/10 border border-amber-300/60 dark:border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D97706] dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {stats?.unpaidVendorInvoices} Tagihan / Invoice Vendor Belum Dibayar
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total kewajiban pembayaran yang masih berjalan:{' '}
                <span className="font-bold text-foreground">
                  {formatCurrency(stats?.totalHutangVendor ?? 0)}
                </span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-xl shrink-0"
            onClick={() => onNavigate('projects')}
          >
            Buka Modul Proyek
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* ===== BOTTOM GRID: RECENT PROJECTS TABLE (KUSALE STYLE) + QUICK ACTIONS ===== */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Projects in Kusale Table Layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Project Status Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border shadow-2xs overflow-x-auto max-w-full">
              {[
                { key: 'ALL', label: 'All Projects' },
                { key: 'IN_PROGRESS', label: 'In Progress' },
                { key: 'DRAFT', label: 'Draft' },
                { key: 'COMPLETED', label: 'Completed' },
              ].map((t) => {
                const active = projectTab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setProjectTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                      active
                        ? 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF] font-semibold'
                        : 'text-muted-foreground hover:text-foreground font-medium'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => onNavigate('projects')}
              className="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Lihat Semua Proyek</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {filteredRecentProjects.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                <p className="font-bold text-foreground text-sm">Belum ada proyek pada filter ini</p>
                <p className="text-xs mt-1">Klik Aksi Cepat untuk membuat proyek baru.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                <div className="hidden sm:grid sm:grid-cols-12 px-5 py-3.5 text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-5">Project</div>
                  <div className="col-span-3">Code</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>
                {filteredRecentProjects.map((project) => {
                  const st = statusBadges[project.status] || statusBadges.DRAFT
                  return (
                    <div
                      key={project.id}
                      onClick={() => onNavigate('projects')}
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-foreground truncate">
                            {project.name}
                          </p>
                          <p className="text-[11.5px] text-muted-foreground truncate">
                            {project.client?.name || 'Klien Umum'}
                          </p>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-xs font-semibold text-primary">
                          {project.projectCode}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {project.type}
                        </span>
                      </div>
                      <div className="sm:col-span-2 flex sm:justify-end">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Kas Kecil Summary */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-foreground">Pintasan Cepat</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Akses langsung ke modul operasional utama
            </p>
            <div className="space-y-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.module)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/[0.04] transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] dark:bg-primary/15 flex items-center justify-center shrink-0">
                    <action.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => onNavigate('finance')}
            className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-primary/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3E8] dark:bg-orange-500/15 flex items-center justify-center">
                <Coins className="w-4.5 h-4.5 text-[#F97316] dark:text-orange-400" />
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                Kas Kecil
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-3.5">Saldo Kas Kecil Saat Ini</p>
            <p className="text-xl font-extrabold text-foreground mt-1">
              {advStats ? formatCurrency(advStats.pettyCashBalance) : 'Rp 0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
