'use client'

import { Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import {
  HeroSection,
  AboutSection,
  ServicesSection,
  ProjectsSection,
  PartnersSection,
  ClientsSection,
  CTASection,
  Navigation,
  Footer,
  StaffLoginDialog,
  useStaffAuth,
} from '@/components/landing'

export default function Home() {
  const { staff, loading, showLogin, setShowLogin, login, logout } = useStaffAuth()

  const handleStaffClick = () => {
    if (!staff) {
      setShowLogin(true)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (staff) {
    return (
      <>
        <DashboardLayout staff={staff} onLogout={handleLogout} />
        <StaffLoginDialog
          open={showLogin}
          onOpenChange={setShowLogin}
          onLogin={login}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onStaffClick={handleStaffClick} staff={staff} onLogout={handleLogout} />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <PartnersSection />
        <ClientsSection />
        <CTASection />
      </main>
      <Footer onStaffClick={handleStaffClick} staff={staff} />
      <StaffLoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onLogin={login}
      />
    </div>
  )
}
