'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Menu,
  X,
  ShoppingCart,
  Wrench,
  Package,
  Wallet,
  Settings,
  Search,
  Bell,
  Mail,
  ChevronDown,
  Sun,
  Moon,
  HelpCircle,
  Sparkles,
  Tag,
  FileText,
  BarChart3,
  Receipt,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardTheme } from '@/hooks/use-dashboard-theme'
import DashboardHome from './DashboardHome'

// Lazy-load dashboard modules for code-splitting
const ClientModule = dynamic(() => import('./ClientModule'), { ssr: false })
const VendorModule = dynamic(() => import('./VendorModule'), { ssr: false })
const ProjectModule = dynamic(() => import('./ProjectModule'), { ssr: false })
const TransactionModule = dynamic(() => import('./TransactionModule'), { ssr: false })
const ServiceModule = dynamic(() => import('./ServiceModule'), { ssr: false })
const InventoryModule = dynamic(() => import('./InventoryModule'), { ssr: false })
const FinanceModule = dynamic(() => import('./FinanceModule'), { ssr: false })
const SettingsModule = dynamic(() => import('./SettingsModule'), { ssr: false })

export type ModuleKey =
  | 'dashboard'
  | 'transactions'
  | 'services'
  | 'inventory'
  | 'finance'
  | 'projects'
  | 'clients'
  | 'vendors'
  | 'settings'

interface DashboardLayoutProps {
  staff: {
    id: string
    name: string
    username: string
    role: string
    avatar: string | null
  }
  onLogout: () => void
}

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  badgeKey?: 'projects' | 'services'
}

// Urutan dan ikon diselaraskan dengan nuansa Kusale + modul PT INDO
const mainNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'projects', label: 'Proyek & RAB', icon: FileText, badgeKey: 'projects' },
  { key: 'inventory', label: 'Stok Produk', icon: Tag },
  { key: 'finance', label: 'Keuangan', icon: BarChart3 },
  { key: 'transactions', label: 'POS Transaksi', icon: Receipt },
  { key: 'services', label: 'POS Service', icon: Wrench, badgeKey: 'services' },
  { key: 'clients', label: 'Pelanggan / Klien', icon: Users },
  { key: 'vendors', label: 'Data Vendor', icon: Building2 },
]

export default function DashboardLayout({ staff, onLogout }: DashboardLayoutProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [badges, setBadges] = useState<{ projects: number; services: number; lowStock: number }>({
    projects: 0,
    services: 0,
    lowStock: 0,
  })

  const searchInputRef = useRef<HTMLInputElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const { theme, toggleTheme, isDark } = useDashboardTheme()

  // Apply scoped Kusale class & dark mode to <html> only while Dashboard is mounted.
  // When user logs out (Landing Page), cleanup restores original Landing Page styling.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('dashboard-kusale')
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    return () => {
      root.classList.remove('dashboard-kusale', 'dark')
    }
  }, [isDark])

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('indio_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  // Fetch badge counts for sidebar & notification bell
  useEffect(() => {
    let cancelled = false
    const loadCounts = async () => {
      try {
        const [projStatsRes, dashStatsRes, prodRes] = await Promise.all([
          fetch('/api/projects/stats'),
          fetch('/api/dashboard/stats'),
          fetch('/api/products'),
        ])
        const projData = await projStatsRes.json().catch(() => ({}))
        const dashData = await dashStatsRes.json().catch(() => ({}))
        const prodData = await prodRes.json().catch(() => ({}))

        if (!cancelled) {
          const unpaidVendor = projData?.stats?.unpaidVendorInvoices ?? 0
          const activeProjects = projData?.stats?.activeProjects ?? 0
          const pendingServices =
            (dashData?.services?.process ?? 0) + (dashData?.services?.pending ?? 0)
          const productsList = Array.isArray(prodData?.data) ? prodData.data : []
          const lowStockCount = productsList.filter((p: { qty?: number }) => (p.qty ?? 0) <= 5).length

          setBadges({
            projects: unpaidVendor > 0 ? unpaidVendor : activeProjects,
            services: pendingServices,
            lowStock: lowStockCount,
          })
        }
      } catch {
        // ignore
      }
    }
    loadCounts()
    return () => {
      cancelled = true
    }
  }, [activeModule])

  // Keyboard shortcut Cmd+F / Ctrl+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen((prev) => !prev)
    } else {
      setIsCollapsed((prev) => {
        const next = !prev
        try {
          localStorage.setItem('indio_sidebar_collapsed', String(next))
        } catch {
          // ignore
        }
        return next
      })
    }
  }

  const handleNavClick = (key: ModuleKey) => {
    setActiveModule(key)
    setSidebarOpen(false)
  }

  const quickSearchModules = [
    { key: 'inventory' as ModuleKey, title: 'Stok Produk (Products)', desc: 'Kelola stok barang, SKU, kategori, dan harga', keywords: 'stok barang produk inventory sku harga' },
    { key: 'transactions' as ModuleKey, title: 'POS Transaksi', desc: 'Kasir penjualan barang dan cetak nota', keywords: 'pos transaksi penjualan kasir invoice nota' },
    { key: 'services' as ModuleKey, title: 'POS Service', desc: 'Penerimaan dan status perbaikan perangkat', keywords: 'service perbaikan teknisi tiket' },
    { key: 'projects' as ModuleKey, title: 'Proyek & RAB', desc: 'Manajemen proyek, RAB, BAST, surat jalan, invoice', keywords: 'proyek rab bast surat jalan kuitansi' },
    { key: 'finance' as ModuleKey, title: 'Keuangan & Kas Kecil', desc: 'Laporan pemasukan, profit, dan kas kecil', keywords: 'keuangan laporan profit kas kecil saldo' },
    { key: 'clients' as ModuleKey, title: 'Pelanggan / Klien', desc: 'Daftar klien perusahaan dan instansi', keywords: 'klien pelanggan customer instansi' },
    { key: 'vendors' as ModuleKey, title: 'Data Vendor', desc: 'Daftar supplier dan rekanan', keywords: 'vendor supplier rekanan' },
    { key: 'settings' as ModuleKey, title: 'Pengaturan (Settings)', desc: 'Profil perusahaan, karyawan, galeri, password', keywords: 'setting pengaturan profil password galeri' },
  ].filter((item) => {
    if (!globalSearch.trim()) return true
    const q = globalSearch.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.keywords.includes(q)
    )
  })

  const totalNotifCount = badges.projects + badges.services + (badges.lowStock > 0 ? 1 : 0)

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome staff={staff} onNavigate={setActiveModule} />
      case 'transactions':
        return <TransactionModule />
      case 'services':
        return <ServiceModule />
      case 'inventory':
        return <InventoryModule />
      case 'finance':
        return <FinanceModule />
      case 'clients':
        return <ClientModule />
      case 'vendors':
        return <VendorModule />
      case 'projects':
        return <ProjectModule />
      case 'settings':
        return <SettingsModule />
      default:
        return <DashboardHome staff={staff} onNavigate={setActiveModule} />
    }
  }

  return (
    <div className={`dashboard-kusale ${isDark ? 'dark' : ''} min-h-screen bg-background text-foreground flex selection:bg-primary/15 selection:text-primary`}>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ===== KUSALE SIDEBAR ===== */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto flex flex-col shrink-0 select-none ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-20' : 'w-64'}`}
      >
        {/* Brand Header (Kusale Logo Style) */}
        <div
          className={`flex items-center h-20 px-6 transition-all ${
            isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
          }`}
        >
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 overflow-hidden text-left group focus:outline-none"
          >
            {/* Royal Blue Rounded Icon Box with 4-Star Diamond Sparkle */}
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <span className="font-extrabold text-[19px] text-foreground block whitespace-nowrap tracking-tight leading-none">
                PT INDO
              </span>
              <span className="text-[11px] text-muted-foreground block whitespace-nowrap font-medium mt-1">
                Enterprise Portal
              </span>
            </div>
          </button>

          {/* Close button for mobile drawer */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = activeModule === item.key
                const badgeCount =
                  item.badgeKey === 'projects'
                    ? badges.projects
                    : item.badgeKey === 'services'
                    ? badges.services
                    : 0

                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    title={item.label}
                    className={`w-full flex items-center gap-3.5 px-6 py-3 text-[14px] transition-all group relative ${
                      isCollapsed ? 'lg:justify-center lg:px-0' : ''
                    } ${
                      isActive
                        ? 'text-primary font-semibold bg-primary/[0.06] dark:bg-primary/[0.12]'
                        : 'text-sidebar-foreground hover:text-foreground hover:bg-foreground/[0.03] font-medium'
                    }`}
                  >
                    {/* Kusale signature left vertical royal-blue indicator bar */}
                    {isActive && (
                      <motion.span
                        layoutId="kusale-active-bar"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <item.icon
                      className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                        isActive
                          ? 'text-primary'
                          : 'text-[#94A3B8] dark:text-slate-500 group-hover:text-foreground'
                      }`}
                    />
                    <span className={`truncate flex-1 text-left ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                      {item.label}
                    </span>

                    {/* Kusale Red Notification Badge on Sidebar Item */}
                    {badgeCount > 0 && !isCollapsed && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-md bg-[#EF4444] text-white shadow-2xs">
                        {badgeCount}
                      </span>
                    )}

                    {/* Tooltip on desktop when sidebar is collapsed */}
                    {isCollapsed && (
                      <span className="hidden lg:group-hover:flex items-center absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none">
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </ScrollArea>

        {/* Bottom Utility Links (Kusale Style: Settings, Theme/Help, Sign Out in Red) */}
        <div className="py-4 border-t border-sidebar-border/60 space-y-1">
          {/* Settings */}
          <button
            onClick={() => handleNavClick('settings')}
            title="Settings"
            className={`w-full flex items-center gap-3.5 px-6 py-2.5 text-[14px] transition-all group relative ${
              isCollapsed ? 'lg:justify-center lg:px-0' : ''
            } ${
              activeModule === 'settings'
                ? 'text-primary font-semibold bg-primary/[0.06]'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-foreground/[0.03] font-medium'
            }`}
          >
            {activeModule === 'settings' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
            )}
            <Settings
              className={`w-[19px] h-[19px] shrink-0 ${
                activeModule === 'settings'
                  ? 'text-primary'
                  : 'text-[#94A3B8] dark:text-slate-500 group-hover:text-foreground'
              }`}
            />
            <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>Settings</span>
          </button>

          {/* Theme Switcher inside Sidebar bottom */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Ubah ke Light Mode' : 'Ubah ke Dark Mode'}
            className={`w-full flex items-center gap-3.5 px-6 py-2.5 text-[14px] font-medium text-sidebar-foreground hover:text-foreground hover:bg-foreground/[0.03] transition-all group relative ${
              isCollapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            {isDark ? (
              <Sun className="w-[19px] h-[19px] shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-[19px] h-[19px] shrink-0 text-[#94A3B8] group-hover:text-foreground" />
            )}
            <span className={`truncate flex-1 text-left ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
            {!isCollapsed && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                {isDark ? 'Dark' : 'Light'}
              </span>
            )}
          </button>

          {/* Sign Out (Red text & icon just like Kusale) */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className={`w-full flex items-center gap-3.5 px-6 py-2.5 text-[14px] font-semibold text-[#EF4444] hover:bg-rose-500/10 transition-all group relative ${
              isCollapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="w-[19px] h-[19px] shrink-0 text-[#EF4444]" />
            <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-background">
        {/* Kusale Top Header */}
        <header className="h-20 bg-background/95 backdrop-blur-md border-b border-border/70 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Left: Sidebar Toggle + Kusale Global Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Stock or Orders (Kusale Search Input) */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Search Stock or Orders"
                className="w-full h-10 pl-10 pr-16 rounded-xl bg-muted/50 dark:bg-card border border-border text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
              <span className="hidden sm:inline-flex items-center gap-0.5 absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground/80 select-none pointer-events-none">
                ⌘ + K
              </span>

              {/* Quick Navigation Search Dropdown */}
              <AnimatePresence>
                {searchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-2xl shadow-xl p-2 z-50"
                  >
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pintasan Modul
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {quickSearchModules.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                          Modul tidak ditemukan
                        </p>
                      ) : (
                        quickSearchModules.map((mod) => (
                          <button
                            key={mod.key}
                            type="button"
                            onMouseDown={() => {
                              setActiveModule(mod.key)
                              setGlobalSearch('')
                              setSearchFocused(false)
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">{mod.title}</p>
                              <p className="text-[11px] text-muted-foreground">{mod.desc}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-primary">Buka →</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Theme Switcher, Notification Icons with Red Badges, User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark atau Light Mode"
              title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
              className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-2xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-xs font-semibold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden md:inline text-xs font-semibold">Dark</span>
                </>
              )}
            </button>

            {/* Notification Bell with Red Counter Badge (Kusale Style) */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] dark:text-slate-300 hover:bg-muted transition-colors"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5 fill-current/10" />
                {totalNotifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-[5px] bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
                    {totalNotifCount > 9 ? '9+' : totalNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-2xl shadow-xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="text-sm font-bold text-foreground">Notifikasi Sistem</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        {totalNotifCount} Baru
                      </span>
                    </div>
                    <div className="divide-y divide-border/60 my-1">
                      <button
                        onClick={() => {
                          setActiveModule('inventory')
                          setNotifOpen(false)
                        }}
                        className="w-full py-3 flex items-start gap-3 text-left hover:bg-muted/50 rounded-xl px-2 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {badges.lowStock} Barang Stok Menipis / Habis
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Cek modul Stok Produk untuk restock barang.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModule('services')
                          setNotifOpen(false)
                        }}
                        className="w-full py-3 flex items-start gap-3 text-left hover:bg-muted/50 rounded-xl px-2 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {badges.services} Tiket Service Sedang Berjalan
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Klik untuk memperbarui status pengerjaan service.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveModule('projects')
                          setNotifOpen(false)
                        }}
                        className="w-full py-3 flex items-start gap-3 text-left hover:bg-muted/50 rounded-xl px-2 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {badges.projects} Aktivitas Proyek & Tagihan
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Pantau progres RAB dan dokumen proyek.
                          </p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Action / Mail Icon with Red Badge (Kusale Style) */}
            <button
              onClick={() => setActiveModule('transactions')}
              className="hidden sm:flex relative w-10 h-10 rounded-xl items-center justify-center text-[#64748B] dark:text-slate-300 hover:bg-muted transition-colors"
              title="Buka POS Transaksi"
            >
              <Mail className="w-5 h-5" />
              {badges.services > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-[5px] bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
                  {badges.services}
                </span>
              )}
            </button>

            {/* User Profile Pill / Dropdown (Kusale Style) */}
            <div className="relative pl-1 sm:pl-2" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-muted/70 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  {staff.avatar ? (
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-9 h-9 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Green Online Status Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>

                <div className="hidden sm:block">
                  <p className="text-[13.5px] font-bold text-foreground leading-tight">
                    {staff.name}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground capitalize leading-tight mt-0.5">
                    {staff.role || 'Admin Staff'}
                  </p>
                </div>

                <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground ml-1" />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-2xl shadow-xl p-2 z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-border/70 mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{staff.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">@{staff.username} · {staff.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveModule('settings')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Pengaturan Profil & Akun
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-muted-foreground" />
                      )}
                      Tema: {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="my-1 border-t border-border/70" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out (Keluar)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-x-hidden">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderModule()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
