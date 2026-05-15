'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function CTASection() {
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
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-base font-semibold"
                    asChild
                  >
                    <a href="mailto:info@intinusadinamika.co.id">
                      <Mail className="w-4 h-4 mr-2" />
                      Hubungi Kami via Email
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-base"
                    asChild
                  >
                    <a href="tel:+622821234567">
                      <Phone className="w-4 h-4 mr-2" />
                      Hubungi Sekarang
                    </a>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2 p-8 lg:p-12 bg-card">
                <h3 className="font-bold text-foreground text-lg mb-6">Hubungi Kami</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Alamat Kantor</p>
                      <p className="text-sm text-muted-foreground">
                        Jl. Jend. Ahmad Yani No.77
                        <br />
                        Cilacap, Jawa Tengah 53211
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Telepon</p>
                      <p className="text-sm text-muted-foreground">(0282) 123-4567</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">info@intinusadinamika.co.id</p>
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
