'use client'

import { Lock, LayoutDashboard } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import type { StaffUser } from './StaffLoginDialog'

export default function Footer({ onStaffClick, staff }: { onStaffClick: () => void; staff: StaffUser | null }) {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IN</span>
              </div>
              <div>
                <p className="font-bold text-sm text-primary-foreground">PT INDO</p>
                <p className="text-[10px] text-primary-foreground/50">Optima</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60 leading-relaxed max-w-xs">
              PT Inti Nusa Dinamika Optima — Your trusted IT solutions partner 
              delivering reliable technology infrastructure from Cilacap to across Indonesia.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Services</h4>
            <ul className="space-y-2">
              {['IT Product Sales', 'Service & Maintenance', 'Infrastructure Solutions', 'Security Systems'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#services"
                      className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Our Projects', href: '#projects' },
                { label: 'Partners', href: '#partners' },
                { label: 'Contact', href: '#contact' },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Contact</h4>
            <div className="space-y-2">
              <p className="text-xs text-primary-foreground/60">
                Jl. Jend. Ahmad Yani No.77, Cilacap
              </p>
              <p className="text-xs text-primary-foreground/60">(0282) 123-4567</p>
              <p className="text-xs text-primary-foreground/60">info@intinusadinamika.co.id</p>
            </div>
          </div>
        </div>

        <Separator className="bg-primary-foreground/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            &copy; {new Date().getFullYear()} PT Inti Nusa Dinamika Optima. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onStaffClick}
              className="text-[10px] text-primary-foreground/20 hover:text-primary-foreground/60 transition-all"
            >
              {staff ? (
                <>
                  <LayoutDashboard className="w-3 h-3 inline mr-0.5" />
                  Dashboard
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 inline mr-0.5" />
                  Staff Login
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
