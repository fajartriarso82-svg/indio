'use client'

import { motion } from 'framer-motion'
import { Monitor, Wrench, Server, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ServicesSection() {
  const services = [
    {
      icon: Monitor,
      image: '/images/service-store.png',
      title: 'Penjualan Produk IT & Toko',
      description:
        'Rangkaian lengkap produk IT — mulai dari workstation, laptop, dan periferal hingga perangkat jaringan. Kunjungi toko fisik kami di Cilacap atau biarkan kami mencarikan dan mengirimkan langsung ke lokasi Anda.',
      features: ['Workstation & Laptop', 'Periferal & Aksesoris', 'Perangkat Jaringan', 'Pemesanan On-site & Online'],
    },
    {
      icon: Wrench,
      image: '/images/service-maintenance.jpeg',
      title: 'Layanan & Perawatan IT',
      description:
        'Pastikan sistem Anda berjalan pada performa optimal dengan program perawatan komprehensif kami. Mulai dari pemeriksaan rutin hingga perbaikan darurat, teknisi bersertifikat kami siap membantu Anda.',
      features: ['Perawatan Preventif', 'Perbaikan Darurat', 'Optimasi Sistem', 'Dukungan Berbasis SLA'],
    },
    {
      icon: Server,
      image: '/images/service-infra.png',
      title: 'Solusi Infrastruktur',
      description:
        'Rancang, terapkan, dan kelola infrastruktur IT yang kokoh — ruang server, sistem UPS, kabel terstruktur, dan jaringan tingkat korporasi yang dibangun untuk keandalan dan pertumbuhan.',
      features: ['Pembangunan Ruang Server', 'Sistem UPS & Kelistrikan', 'Kabel Terstruktur', 'Jaringan Korporasi'],
    },
    {
      icon: ShieldCheck,
      image: '/images/service-cctv.jpeg',
      title: 'Sistem Keamanan',
      description:
        'Lindungi aset Anda dengan pemasangan CCTV profesional dan solusi keamanan terintegrasi. Kami merancang sistem pengawasan yang disesuaikan dengan kebutuhan fasilitas dan kepatuhan Anda.',
      features: ['Pemasangan CCTV', 'Kontrol Akses', 'Pemantauan Jarak Jauh', 'Pengaturan Siap Kepatuhan'],
    },
  ]

  return (
    <section id="services" className="py-20 lg:py-28 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Wrench className="w-3 h-3 mr-1.5" />
            Layanan Kami
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Solusi IT <span className="text-primary">Komprehensif</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Empat pilar layanan, satu titik akuntabilitas. Mulai dari pengadaan hingga perlindungan —
            kami mencakup setiap lapisan ekosistem IT Anda.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <service.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {service.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
