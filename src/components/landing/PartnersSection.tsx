'use client'

import { motion } from 'framer-motion'
import { Award, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCompanyProfile } from '@/hooks/use-company-profile'

export default function PartnersSection() {
  const { company } = useCompanyProfile()

  const partners = [
    {
      name: 'Siplah',
      tag: 'Kemdikbud',
      description: 'Platform e-Pengadaan Pemerintah',
      detail: 'Mitra resmi untuk pengadaan IT sekolah & instansi pemerintah melalui marketplace Siplah.',
      url: company?.siplahUrl || '',
    },
    {
      name: 'eKatalog',
      tag: 'LKPP RI',
      description: 'Sistem e-Katalog LKPP',
      detail: 'Vendor terdaftar di e-katalog nasional untuk pengadaan pemerintah yang transparan dan patuh regulasi.',
      url: company?.ekatalogUrl || '',
    },
    {
      name: 'Padi UMKM',
      tag: 'BUMN',
      description: 'Platform Digital UMKM',
      detail: 'Mendukung transformasi digital usaha mikro, kecil & menengah melalui ekosistem Padi UMKM.',
      url: company?.padiUmkmUrl || '',
    },
  ]

  return (
    <section id="partners" className="py-20 lg:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Award className="w-3 h-3 mr-1.5" />
            Kemitraan Resmi
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Kanal <span className="text-primary">Pengadaan Berizin</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Terdaftar secara resmi di platform pengadaan nasional, memastikan pembelian yang transparan,
            patuh regulasi, dan terstruktur bagi klien pemerintah dan institusi.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <Card className="group text-center hover:shadow-xl hover:border-primary/40 transition-all duration-300 h-full flex flex-col justify-between">
                <CardContent className="p-6 lg:p-8 flex flex-col items-center flex-1 justify-between">
                  <div>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-5 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:scale-105 transition-all">
                      <span className="text-2xl font-bold text-primary">{partner.name.charAt(0)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">{partner.name}</h3>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {partner.tag}
                      </Badge>
                    </div>
                    <p className="text-xs text-primary font-medium mb-3">{partner.description}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {partner.detail}
                    </p>
                  </div>

                  <div className="w-full pt-4 border-t border-border/60">
                    {partner.url ? (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all duration-200 group/btn"
                      >
                        <span>Kunjungi Etalase {partner.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mitra Penyedia Terdaftar</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
