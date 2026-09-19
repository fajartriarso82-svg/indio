'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Users, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PublicClient {
  id: string
  name: string
  type: string
  notes: string | null
  iconUrl: string | null
  isStarred: boolean
}

const typeLabels: Record<string, string> = {
  corporate: 'Korporat',
  government: 'Pemerintah / BUMN',
  individual: 'Perorangan',
}

export default function ClientsSection() {
  const [clients, setClients] = useState<PublicClient[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchStarredClients() {
      try {
        const res = await fetch('/api/clients/public')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.data)) {
          setClients(data.data)
        }
      } catch (err) {
        console.error('Error fetching public clients:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchStarredClients()
    return () => {
      isMounted = false
    }
  }, [])

  const PAGE_SIZE = 3
  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE))

  // Keep currentPage within bounds if clients change
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0)
    }
  }, [totalPages, currentPage])

  // Auto-play every 5 seconds, pauses on hover
  useEffect(() => {
    if (totalPages <= 1 || isHovered) return

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages)
    }, 5000)

    return () => clearInterval(timer)
  }, [totalPages, isHovered])

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const currentChunk = clients.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  )

  return (
    <section id="clients" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Users className="w-3 h-3 mr-1.5" />
            Klien Utama
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Dipercaya oleh <span className="text-primary">Pemimpin Industri</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Mulai dari raksasa energi BUMN hingga pemain industri utama —
            klien mempercayakan operasi IT paling kritis dan infrastruktur teknologi kepada kami.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/40 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">
              Belum Ada Klien Berbintang
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Beri tanda bintang ⭐ pada daftar klien di Dashboard menu Klien untuk memamerkannya di landing page ini.
            </p>
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Carousel Content */}
            <div className="min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {currentChunk.map((client) => (
                    <Card
                      key={client.id}
                      className="group border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between"
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          {/* Logo / Icon container */}
                          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2.5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors shrink-0">
                            {client.iconUrl ? (
                              <img
                                src={client.iconUrl}
                                alt={client.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-7 h-7 text-primary" />
                            )}
                          </div>

                          {/* Star badge */}
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Mitra Unggulan</span>
                          </div>
                        </div>

                        {/* Text Information */}
                        <div className="space-y-2 flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {client.name}
                          </h3>
                          <div>
                            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider">
                              {typeLabels[client.type] || client.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-2">
                            {client.notes || 'Kemitraan strategis solusi pengadaan & infrastruktur teknologi.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls (Shown when there is more than 1 page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={handlePrev}
                    aria-label="Halaman Klien Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={handleNext}
                    aria-label="Halaman Klien Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    Halaman {currentPage + 1} dari {totalPages} ({clients.length} klien berbintang)
                  </span>
                </div>

                {/* Pagination Dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentPage
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      }`}
                      aria-label={`Ke halaman ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
