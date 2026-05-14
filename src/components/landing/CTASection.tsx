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
                  Ready to Upgrade Your IT Infrastructure?
                </h2>
                <p className="text-primary-foreground/80 mb-8 leading-relaxed max-w-lg">
                  Whether you need a complete server room setup, CCTV installation, 
                  or IT equipment procurement — our team is ready to deliver. Contact us 
                  for a free consultation and let&apos;s build your technology roadmap together.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-base font-semibold"
                    asChild
                  >
                    <a href="mailto:info@intinusadinamika.co.id">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Us
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
                      Call Now
                    </a>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2 p-8 lg:p-12 bg-card">
                <h3 className="font-bold text-foreground text-lg mb-6">Get in Touch</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Office Address</p>
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
                      <p className="text-sm font-semibold text-foreground">Phone</p>
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
                      <p className="text-sm font-semibold text-foreground">Procurement Platforms</p>
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
