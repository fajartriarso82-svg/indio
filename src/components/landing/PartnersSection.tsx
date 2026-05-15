'use client'

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PartnersSection() {
  const partners = [
    {
      name: 'Siplah',
      description: 'Platform e-Pengadaan Pemerintah',
      detail: 'Mitra resmi untuk pengadaan IT sekolah & instansi pemerintah melalui marketplace Siplah.',
    },
    {
      name: 'eKatalog',
      description: 'Sistem e-Katalog LKPP',
      detail: 'Vendor terdaftar di e-katalog nasional untuk pengadaan pemerintah yang transparan dan patuh regulasi.',
    },
    {
      name: 'Padi UMKM',
      description: 'Platform Digital UMKM',
      detail: 'Mendukung transformasi digital usaha mikro, kecil & menengah melalui ekosistem Padi UMKM.',
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
              <Card className="group text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="p-6 lg:p-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                    <span className="text-2xl font-bold text-primary">{partner.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{partner.name}</h3>
                  <p className="text-xs text-primary font-medium mb-3">{partner.description}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{partner.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
