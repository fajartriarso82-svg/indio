'use client'

import { motion } from 'framer-motion'
import { Building2, Users, Award, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ProjectsSection() {
  const projectCategories = [
    {
      type: 'Proyek Pemerintah',
      description:
        'Mitra pengadaan berizin untuk instansi pemerintah melalui platform Siplah dan eKatalog. Kami menangani segalanya mulai dari dokumentasi tender hingga penerapan dan serah terima.',
      icon: Building2,
      count: '40+',
    },
    {
      type: 'Proyek Sektor Swasta',
      description:
        'Dipercaya oleh korporasi besar termasuk BUMN untuk peningkatan infrastruktur IT, penerapan sistem keamanan, dan kontrak perawatan berkelanjutan.',
      icon: Users,
      count: '110+',
    },
  ]

  const projectHighlights = [
    'Perancangan & penerapan ruang server untuk fasilitas industri',
    'Sistem CCTV & kontrol akses untuk kilang',
    'Infrastruktur jaringan kampus untuk kantor pemerintah',
    'Pengadaan & pemasangan peralatan IT untuk kantor cabang',
    'Solusi UPS & backup daya untuk operasi kritis',
    'Kontrak perawatan berkelanjutan dengan jaminan SLA',
  ]

  return (
    <section id="projects" className="py-20 lg:py-28 bg-background">
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
            Rekam Jejak
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Rekam Jejak <span className="text-primary">Pengiriman Proyek</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Satu dekade pengiriman proyek IT misi kritis untuk instansi pemerintah
            maupun perusahaan swasta di seluruh Indonesia.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {projectCategories.map((cat, idx) => (
            <motion.div
              key={cat.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <cat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-primary">{cat.count}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{cat.type}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 lg:p-8">
              <h3 className="font-bold text-foreground mb-4">Proyek Unggulan</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {projectHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
