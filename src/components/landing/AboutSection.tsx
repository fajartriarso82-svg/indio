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
              About Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
              Your Trusted IT Solutions
              <br />
              <span className="text-primary">Partner in Cilacap</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">PT Inti Nusa Dinamika Optima</strong> is a 
              Cilacap-based IT firm committed to delivering reliable, scalable technology solutions 
              for businesses and government institutions across Indonesia. With deep expertise in 
              IT procurement, infrastructure deployment, maintenance services, and security systems, 
              we serve as a single point of accountability for all your technology needs.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our team of certified professionals brings hands-on experience from deploying 
              mission-critical systems for state-owned enterprises and private corporations alike. 
              We combine local presence with national-grade capabilities — ensuring your projects 
              are delivered on time, on spec, and on budget.
            </p>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Headquarters</p>
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
                title: 'Certified Team',
                desc: 'Industry-certified engineers & technicians',
              },
              {
                icon: ShieldCheck,
                title: 'Trusted Partner',
                desc: 'Government & enterprise grade solutions',
              },
              {
                icon: Users,
                title: 'Client-Focused',
                desc: 'Dedicated support & long-term partnerships',
              },
              {
                icon: Globe,
                title: 'National Reach',
                desc: 'Serving clients across Indonesia',
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
