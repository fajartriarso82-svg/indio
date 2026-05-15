'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import DashboardHome from './DashboardHome'
import ClientModule from './ClientModule'
import VendorModule from './VendorModule'
import ProjectModule from './ProjectModule'

export type ModuleKey = 'dashboard' | 'clients' | 'vendors' | 'projects'

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
  { key: 'projects', label: 'Proyek', icon: FolderKanban },
  { key: 'clients', label: 'Klien', icon: Users },
  { key: 'vendors', label: 'Vendor', icon: Building2 },
]

export default function DashboardLayout({ staff, onLogout }: DashboardLayoutProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavClick = (key: ModuleKey) => {
    setActiveModule(key)
    setSidebarOpen(false)
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome staff={staff} onNavigate={setActiveModule} />
      case 'clients':
        return <ClientModule />
      case 'vendors':
        return <VendorModule />
      case 'projects':
        return <ProjectModule />
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IN</span>
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">PT INDO</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Portal Staff</span>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeModule === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : ''}`} />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <Separator className="mx-3 my-2" />

          <div className="p-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-sm font-bold">
                  {staff.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{staff.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{staff.role}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top navbar */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground capitalize">
                {activeModule === 'dashboard' ? 'Beranda' : activeModule === 'projects' ? 'Proyek' : activeModule === 'clients' ? 'Klien' : activeModule === 'vendors' ? 'Vendor' : activeModule}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">
                  {staff.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{staff.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight capitalize">{staff.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
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
