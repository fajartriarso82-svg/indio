'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { CompanyProfile } from '@/hooks/use-company-profile'

export default function CTASection({ company }: { company?: CompanyProfile | null }) {
  const companyPhone = company?.phone?.trim() || ''
  const companyEmail = company?.email?.trim() || ''
  const companyAddress = company?.address?.trim() || ''

  return (
    <section id="contact" className="py-20 lg:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 lg:p-12 bg-gradient-to-br from-primary to-primary/80 flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                  Siap Meningkatkan Kapabilitas Infrastruktur IT?
                </h2>
                <p className="text-primary-foreground/80 mb-8 leading-relaxed max-w-lg">
                  Baik Anda membutuhkan pembangunan ruang server, pemasangan CCTV,
                  atau pengadaan peralatan IT — tim kami siap membantu. Hubungi kami
                  untuk konsultasi gratis dan mari bersama menyusun peta teknologi Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {companyEmail && (
                    <Button
                      size="lg"
                      className="h-12 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90"
                      asChild
                    >
                      <a href={`mailto:${companyEmail}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Hubungi Kami via Email
                      </a>
                    </Button>
                  )}
                  {companyPhone && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-8 text-base border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground hover:border-primary-foreground/70"
                      asChild
                    >
                      <a href={`tel:${companyPhone.replace(/[^0-9+]/g, '')}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Hubungi Sekarang
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 p-8 lg:p-12 bg-card">
                <h3 className="font-bold text-foreground text-lg mb-6">Hubungi Kami</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Alamat Kantor</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {companyAddress || 'Alamat kantor belum diatur di menu Setting.'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Telepon</p>
                      {companyPhone ? (
                        <p className="text-sm text-muted-foreground">
                          <a
                            href={`tel:${companyPhone.replace(/[^0-9+]/g, '')}`}
                            className="hover:text-primary transition-colors"
                          >
                            {companyPhone}
                          </a>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Belum diatur</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Email</p>
                      {companyEmail ? (
                        <p className="text-sm text-muted-foreground">
                          <a
                            href={`mailto:${companyEmail}`}
                            className="hover:text-primary transition-colors"
                          >
                            {companyEmail}
                          </a>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Belum diatur</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Platform Pengadaan</p>
                      <p className="text-sm text-muted-foreground">
                        Siplah · eKatalog · Padi UMKM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
