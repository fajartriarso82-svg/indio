'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogOut, Menu, X } from 'lucide-react'
import type { StaffUser } from './StaffLoginDialog'

export default function Navigation({
  onStaffClick,
  staff,
  onLogout,
}: {
  onStaffClick: () => void
  staff: StaffUser | null
  onLogout: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Partners', href: '#partners' },
    { label: 'Clients', href: '#clients' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IN</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-sm leading-tight transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                PT INDO
              </span>
              <span className={`text-[10px] leading-tight transition-colors ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}>
                Optima
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-primary/10 ${
                  scrolled
                    ? 'text-foreground/80 hover:text-primary'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            {/* Hidden Staff Login / Dashboard */}
            {staff ? (
              <button
                onClick={onLogout}
                className={`px-2 py-1 text-[10px] font-normal rounded transition-all opacity-40 hover:opacity-100 ${
                  scrolled
                    ? 'text-muted-foreground hover:text-primary'
                    : 'text-white/40 hover:text-white/90'
                }`}
                title="Staff Logout"
              >
                <LogOut className="w-3 h-3 inline mr-0.5" />
                Staff
              </button>
            ) : (
              <button
                onClick={onStaffClick}
                className={`px-2 py-1 text-[10px] font-normal rounded transition-all opacity-30 hover:opacity-100 ${
                  scrolled
                    ? 'text-muted-foreground hover:text-primary'
                    : 'text-white/40 hover:text-white/90'
                }`}
                title="Staff Login"
              >
                <Lock className="w-3 h-3 inline mr-0.5" />
                Staff
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className={`lg:hidden p-2 rounded-md transition-colors ${
              scrolled ? 'text-foreground' : 'text-white'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false)
                  if (staff) {
                    onLogout()
                  } else {
                    onStaffClick()
                  }
                }}
                className="block w-full text-left px-3 py-2.5 text-[11px] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all"
              >
                {staff ? (
                  <>
                    <LogOut className="w-3 h-3 inline mr-1" />
                    Staff Logout
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 inline mr-1" />
                    Staff Login
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
