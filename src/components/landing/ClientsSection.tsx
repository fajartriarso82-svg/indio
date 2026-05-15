'use client'

import { motion } from 'framer-motion'
import { Building2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientsSection() {
  const clients = [
    {
      name: 'Pertamina Cilacap',
      type: 'BUMN',
      description: 'Solusi IT untuk infrastruktur kilang & energi',
      icon: Building2,
    },
    {
      name: 'PT SBI — Cilacap',
      type: 'Industri',
      description: 'Sistem IT industri & penerapan keamanan',
      icon: Building2,
    },
    {
      name: 'PT SBI — Narogong',
      type: 'Industri',
      description: 'Standardisasi infrastruktur lintas lokasi',
      icon: Building2,
    },
    {
      name: 'PT SBI — Tuban',
      type: 'Industri',
      description: 'Pemasangan CCTV & jaringan fasilitas',
      icon: Building2,
    },
  ]

  return (
    <section id="clients" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Users className="w-3 h-3 mr-1.5" />
            Klien Utama
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Dipercaya oleh <span className="text-primary">Pemimpin Industri</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mulai dari raksasa energi BUMN hingga pemain industri utama —
            klien kami mempercayakan operasi IT paling kritis kepada kami.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {clients.map((client, idx) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="group text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <client.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{client.name}</h3>
                  <Badge variant="outline" className="text-[10px] mb-2">
                    {client.type}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">{client.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
