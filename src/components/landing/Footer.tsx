'use client'

import { Lock, LayoutDashboard } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import type { StaffUser } from './StaffLoginDialog'
import type { CompanyProfile } from '@/hooks/use-company-profile'

export default function Footer({
  onStaffClick,
  staff,
  company,
}: {
  onStaffClick: () => void
  staff: StaffUser | null
  company?: CompanyProfile | null
}) {
  const companyName = company?.name?.trim() || 'PT Inti Nusa Dinamika Optima'
  const logoUrl = company?.logoFile?.trim() || ''

  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              {/* Logo — diambil dari logo perusahaan yang diunggah di menu Setting */}
              {logoUrl ? (
                <span className="w-9 h-9 rounded-lg bg-white/95 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={logoUrl}
                    alt={`Logo ${companyName}`}
                    className="w-full h-full object-contain"
                  />
                </span>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">IN</span>
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-primary-foreground uppercase">{companyName}</p>
                <p className="text-[10px] text-primary-foreground/50">Cilacap</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60 leading-relaxed max-w-xs">
              {companyName} — Mitra solusi IT terpercaya Anda
              yang menyediakan infrastruktur teknologi andal dari Cilacap ke seluruh Indonesia.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Layanan</h4>
            <ul className="space-y-2">
              {['Penjualan Produk IT', 'Layanan & Perawatan', 'Solusi Infrastruktur', 'Sistem Keamanan'].map(
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
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Perusahaan</h4>
            <ul className="space-y-2">
              {[
                { label: 'Tentang Kami', href: '#about' },
                { label: 'Proyek Kami', href: '#projects' },
                { label: 'Mitra', href: '#partners' },
                { label: 'Kontak', href: '#contact' },
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
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Kontak</h4>
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
            &copy; {new Date().getFullYear()} {companyName}. Hak cipta dilindungi.
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
                  Masuk Staff
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
