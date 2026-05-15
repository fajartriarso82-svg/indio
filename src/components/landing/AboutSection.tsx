'use client'

import { motion } from 'framer-motion'
import { Award, ShieldCheck, Users, Globe, Building2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">
              <Building2 className="w-3 h-3 mr-1.5" />
              Tentang Kami
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
              Mitra Solusi IT Terpercaya
              <br />
              <span className="text-primary">Anda di Cilacap</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">PT Inti Nusa Dinamika Optima</strong> adalah perusahaan IT yang berbasis di Cilacap, berkomitmen untuk menyediakan solusi teknologi yang andal dan skalabel bagi bisnis dan instansi pemerintah di seluruh Indonesia. Dengan keahlian mendalam dalam pengadaan IT, penerapan infrastruktur, layanan perawatan, dan sistem keamanan, kami menjadi satu titik akuntabilitas untuk seluruh kebutuhan teknologi Anda.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Tim profesional bersertifikat kami memiliki pengalaman langsung dalam menerapkan
              sistem misi kritis untuk BUMN maupun korporasi swasta. Kami menggabungkan kehadiran lokal
              dengan kapabilitas tingkat nasional — memastikan proyek Anda diselesaikan tepat waktu,
              sesuai spesifikasi, dan sesuai anggaran.
            </p>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Kantor Pusat</p>
                <p className="text-sm text-muted-foreground">
                  Jl. Jend. Ahmad Yani No.77, Cilacap, Jawa Tengah, Indonesia
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              {
                icon: Award,
                title: 'Tim Bersertifikat',
                desc: 'Insinyur & teknisi bersertifikat industri',
              },
              {
                icon: ShieldCheck,
                title: 'Mitra Terpercaya',
                desc: 'Solusi tingkat pemerintah & korporasi',
              },
              {
                icon: Users,
                title: 'Berorientasi Klien',
                desc: 'Dukungan khusus & kemitraan jangka panjang',
              },
              {
                icon: Globe,
                title: 'Jangkauan Nasional',
                desc: 'Melayani klien di seluruh Indonesia',
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="group hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
