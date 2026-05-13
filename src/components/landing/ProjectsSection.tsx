'use client'

import { motion } from 'framer-motion'
import { Building2, Users, Award, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ProjectsSection() {
  const projectCategories = [
    {
      type: 'Government Projects',
      description:
        'Licensed procurement partner for government institutions through Siplah and eKatalog platforms. We handle everything from tender documentation to deployment and handover.',
      icon: Building2,
      count: '40+',
    },
    {
      type: 'Private Sector Projects',
      description:
        'Trusted by major corporations including state-owned enterprises for IT infrastructure upgrades, security system deployments, and ongoing maintenance contracts.',
      icon: Users,
      count: '110+',
    },
  ]

  const projectHighlights = [
    'Server room design & deployment for industrial facilities',
    'CCTV & access control systems for refineries',
    'Campus-wide network infrastructure for government offices',
    'IT equipment procurement & rollout for regional offices',
    'UPS & power backup solutions for critical operations',
    'Ongoing maintenance contracts with SLA guarantees',
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
            Track Record
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Proven <span className="text-primary">Project Delivery</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A decade of delivering mission-critical IT projects for both government 
            institutions and private enterprises across Indonesia.
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
              <h3 className="font-bold text-foreground mb-4">Project Highlights</h3>
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
