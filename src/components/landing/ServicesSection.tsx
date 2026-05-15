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
      title: 'IT Product Sales & Physical Store',
      description:
        'Complete range of IT products — from workstations, laptops, and peripherals to networking equipment. Visit our physical store in Cilacap or let us source and deliver directly to your site.',
      features: ['Workstations & Laptops', 'Peripherals & Accessories', 'Networking Equipment', 'On-site & Online Orders'],
    },
    {
      icon: Wrench,
      image: '/images/service-maintenance.jpeg',
      title: 'IT Service & Maintenance',
      description:
        'Keep your systems running at peak performance with our comprehensive maintenance programs. From routine check-ups to emergency repairs, our certified technicians have you covered.',
      features: ['Preventive Maintenance', 'Emergency Repair', 'System Optimization', 'SLA-backed Support'],
    },
    {
      icon: Server,
      image: '/images/service-infra.png',
      title: 'Infrastructure Solutions',
      description:
        'Design, deploy, and manage robust IT infrastructure — server rooms, UPS systems, structured cabling, and enterprise-grade networks built for reliability and growth.',
      features: ['Server Room Setup', 'UPS & Power Systems', 'Structured Cabling', 'Enterprise Networking'],
    },
    {
      icon: ShieldCheck,
      image: '/images/service-cctv.jpeg',
      title: 'Security Systems',
      description:
        "Protect your assets with professional CCTV installation and integrated security solutions. We design surveillance systems tailored to your facility's requirements and compliance needs.",
      features: ['CCTV Installation', 'Access Control', 'Remote Monitoring', 'Compliance-ready Setup'],
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
            What We Do
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Comprehensive <span className="text-primary">IT Solutions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Four pillars of service, one point of accountability. From procurement to protection — 
            we cover every layer of your IT ecosystem.
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
