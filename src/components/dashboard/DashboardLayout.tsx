'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import DashboardHome from './DashboardHome'

// Lazy-load dashboard modules for code-splitting (reduces initial bundle size).
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

const navItems: { key: ModuleKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { key: 'transactions', label: 'POS Transaksi', icon: ShoppingCart },
  { key: 'services', label: 'POS Service', icon: Wrench },
  { key: 'inventory', label: 'Stok', icon: Package },
  { key: 'finance', label: 'Keuangan', icon: Wallet },
  { key: 'projects', label: 'Proyek', icon: FolderKanban },
  { key: 'clients', label: 'Klien', icon: Users },
  { key: 'vendors', label: 'Vendor', icon: Building2 },
  { key: 'settings', label: 'Setting', icon: Settings },
]

export default function DashboardLayout({ staff, onLogout }: DashboardLayoutProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r border-border z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${
          isCollapsed ? 'w-72 lg:w-20' : 'w-72'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex items-center h-16 lg:h-17 px-4.5 border-b border-border transition-all ${
            isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between lg:justify-start'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-primary-foreground font-bold text-base">IN</span>
            </div>
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <span className="font-bold text-[15px] text-foreground block whitespace-nowrap tracking-tight">PT INDO</span>
              <span className="text-xs text-muted-foreground block whitespace-nowrap font-medium">Portal Staff</span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <ScrollArea className="flex-1 h-[calc(100vh-4.25rem)]">
          <nav className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeModule === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  title={item.label}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[14.5px] font-medium transition-all group relative ${
                    isCollapsed ? 'lg:justify-center lg:px-0' : ''
                  } ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                    {item.label}
                  </span>

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

          <Separator className="mx-3.5 my-2.5" />

          {/* User profile section */}
          <div className="p-3.5">
            <div
              className={`flex items-center gap-3 p-3 rounded-xl bg-primary/5 transition-all ${
                isCollapsed ? 'lg:justify-center lg:p-2' : ''
              }`}
            >
              <div
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm"
                title={`${staff.name} (${staff.role})`}
              >
                <span className="text-primary-foreground text-sm font-bold">
                  {staff.name.charAt(0)}
                </span>
              </div>
              <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-sm font-semibold text-foreground truncate">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{staff.role}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top navbar */}
        <header className="h-16 lg:h-17 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            {/* Hamburger button: toggles collapse on desktop & drawer on mobile */}
            <button
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground capitalize tracking-tight">
                {activeModule === 'dashboard'
                  ? 'Beranda'
                  : activeModule === 'transactions'
                  ? 'POS Transaksi'
                  : activeModule === 'services'
                  ? 'POS Service'
                  : activeModule === 'inventory'
                  ? 'Stok'
                  : activeModule === 'finance'
                  ? 'Keuangan'
                  : activeModule === 'projects'
                  ? 'Proyek'
                  : activeModule === 'clients'
                  ? 'Klien'
                  : activeModule === 'vendors'
                  ? 'Vendor'
                  : activeModule === 'settings'
                  ? 'Setting'
                  : activeModule}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-xs">
                <span className="text-primary-foreground text-xs font-bold">
                  {staff.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{staff.name}</p>
                <p className="text-[11px] text-muted-foreground leading-tight capitalize mt-0.5">{staff.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-x-hidden">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderModule()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
