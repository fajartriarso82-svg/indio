'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  Users,
  Building2,
  FileText,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Wrench,
  Wallet,
  Coins,
  AlertTriangle,
  Package,
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
      isCurrency: false,
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
      isCurrency: false,
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
      isCurrency: true,
    },
    {
      icon: Coins,
      label: 'Saldo Kas Kecil',
      value: advStats ? formatCurrency(advStats.pettyCashBalance) : 'Rp 0',
      badge: 'Kas Kecil',
      iconBox: 'bg-[#EEF0FF] text-[#6366F1] dark:bg-indigo-500/15 dark:text-indigo-400',
      badgeClass: 'bg-[#EEF0FF] text-[#4F46E5] dark:bg-indigo-500/20 dark:text-indigo-300',
      module: 'finance' as ModuleKey,
      isCurrency: true,
    },
  ]

  const statCards = [
    {
      icon: FolderKanban,
      label: 'Proyek Aktif',
      value: stats?.activeProjects ?? 0,
      badge: 'Berjalan',
      iconBox: 'bg-[#EEF0FF] text-primary dark:bg-primary/15 dark:text-[#8190FF]',
      badgeClass: 'bg-[#EEF0FF] text-primary dark:bg-primary/20 dark:text-[#8190FF]',
      module: 'projects' as ModuleKey,
      isCurrency: false,
    },
    {
      icon: FileText,
      label: 'Invoice Tertunda',
      value: stats?.pendingInvoices ?? 0,
      badge: 'Menunggu',
      iconBox: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
      badgeClass: 'bg-[#FFEFEF] text-[#E11D48] dark:bg-rose-500/15 dark:text-rose-400',
      module: 'projects' as ModuleKey,
      isCurrency: false,
    },
    {
      icon: Building2,
      label: 'Total Vendor',
      value: stats?.totalVendors ?? 0,
      badge: 'Mitra Aktif',
      iconBox: 'bg-[#FFF3E8] text-[#F97316] dark:bg-orange-500/15 dark:text-orange-400',
      badgeClass: 'bg-[#FFF4E5] text-[#D97706] dark:bg-amber-500/15 dark:text-amber-400',
      module: 'vendors' as ModuleKey,
      isCurrency: false,
    },
    {
      icon: Users,
      label: 'Total Klien',
      value: stats?.totalClients ?? 0,
      badge: 'Terdaftar',
      iconBox: 'bg-[#E6F8F3] text-[#10B981] dark:bg-emerald-500/15 dark:text-emerald-400',
      badgeClass: 'bg-[#E6F8F3] text-[#0D9488] dark:bg-emerald-500/15 dark:text-emerald-400',
      module: 'clients' as ModuleKey,
      isCurrency: false,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {businessCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            onClick={() => onNavigate(stat.module)}
            className="bg-card border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${stat.iconBox} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${stat.badgeClass}`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-muted-foreground mt-3.5 leading-tight">{stat.label}</p>
            </div>
            <div className="mt-2">
              <p
                className={`font-extrabold text-foreground tracking-tight leading-none ${
                  stat.isCurrency
                    ? 'text-[18px] sm:text-[20px] xl:text-[22px] truncate'
                    : 'text-[24px] sm:text-[26px]'
                }`}
                title={typeof stat.value === 'string' ? stat.value : undefined}
              >
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
            onClick={() => onNavigate(stat.module)}
            className="bg-card border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${stat.iconBox} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${stat.badgeClass}`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-muted-foreground mt-3.5 leading-tight">{stat.label}</p>
            </div>
            <div className="mt-2">
              <p
                className={`font-extrabold text-foreground tracking-tight leading-none ${
                  stat.isCurrency
                    ? 'text-[18px] sm:text-[20px] xl:text-[22px] truncate'
                    : 'text-[24px] sm:text-[26px]'
                }`}
                title={typeof stat.value === 'string' ? stat.value : undefined}
              >
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {Boolean(stats?.unpaidVendorInvoices && stats.unpaidVendorInvoices > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#FFF4E5] dark:bg-amber-500/10 border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {recentProjects.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground px-4 text-center">
                <p className="font-bold text-foreground text-sm">Belum ada proyek yang terdaftar</p>
                <p className="text-xs mt-1">Gunakan Pintasan Cepat untuk membuat proyek baru.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                <div className="hidden sm:grid sm:grid-cols-12 px-5 py-3.5 text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-5">Project</div>
                  <div className="col-span-3">Code</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>
                {recentProjects.map((project) => {
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

        <div>
          <div className="bg-card border border-emerald-500/60 dark:border-emerald-400/60 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-foreground">Pintasan Cepat</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Akses langsung ke modul operasional utama
            </p>
            <div className="space-y-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.module)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-emerald-400 hover:bg-emerald-500/[0.04] transition-all text-left group"
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
        </div>
      </div>
    </div>
  )
}