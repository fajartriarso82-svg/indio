'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  MessageSquareQuote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface GallerySlideItem {
  id: string
  title: string
  comment: string | null
  imageUrl: string
  sortOrder?: number
}

// Fallback data yang tampil jika admin belum menambahkan foto galeri dari dashboard
const FALLBACK_GALLERY: GallerySlideItem[] = [
  {
    id: 'f1',
    title: 'Pengadaan 60 Unit PC Workstation & Server Diskominfo',
    comment:
      'Pengiriman batch 1 & 2 telah diterima lengkap dengan pengujian benchmark performa dan serah terima BAST 100% tepat waktu.',
    imageUrl:
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f2',
    title: 'Instalasi Rack Server & Sistem UPS Gedung BUMN',
    comment:
      'Pemasangan rack server 42U dan UPS online redundant berjalan lancar tanpa downtime pada sistem operasional eksisting.',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f3',
    title: 'Penyediaan 120 Unit Laptop Operasional Kantor Cabang',
    comment:
      'Distribusi laptop bisnis berspesifikasi khusus beserta konfigurasi enterprise image dan garansi resmi onsite.',
    imageUrl:
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f4',
    title: 'Implementasi Jaringan Switch & Wi-Fi 6 Enterprise',
    comment:
      'Pengadaan access point Wi-Fi 6 dan switch core terkelola untuk mencakup area gedung perkantoran secara stabil.',
    imageUrl:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f5',
    title: 'Pengadaan CCTV AI & Sistem Keamanan Terpadu Fasilitas',
    comment:
      'Pemasangan 32 titik kamera IP resolusi tinggi dengan NVR terpusat dan sensor perimeter untuk fasilitas pergudangan.',
    imageUrl:
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f6',
    title: 'Modernisasi Ruang Kontrol SCADA & Monitoring Kilang',
    comment:
      'Integrasi video wall 4K multi-display dengan sistem backup daya kontinu untuk operasional non-stop 24/7.',
    imageUrl:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
]

export default function ProjectsSection() {
  const [items, setItems] = useState<GallerySlideItem[]>(FALLBACK_GALLERY)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1: next, -1: prev
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    fetchPublicGallery()
  }, [])

  const fetchPublicGallery = async () => {
    try {
      const res = await fetch('/api/gallery/public')
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setItems(data.data)
        }
      }
    } catch (err) {
      console.error('Error loading gallery for landing page:', err)
    }
  }

  // Model: 2 kolom, 1 baris
  // Kita kelompokkan item per 2 kolom per halaman (page)
  const pageSize = 2
  const totalPages = Math.ceil(items.length / pageSize)

  const handleNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }, [totalPages])

  const handlePrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])

  // Timer auto-slide setiap 5 detik (5000ms), jeda jika di-hover kursor
  useEffect(() => {
    if (isHovered || totalPages <= 1) return

    const timer = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(timer)
  }, [isHovered, totalPages, handleNext])

  // Ambil 2 item untuk halaman saat ini
  const pageItems = items.slice(currentIndex * pageSize, currentIndex * pageSize + pageSize)
  // Jika di halaman terakhir hanya ada 1 item dan ada item lain, kita bisa tampilkan 1 item atau gabungkan
  const displayCards = pageItems.length > 0 ? pageItems : items.slice(0, pageSize)

  return (
    <section id="projects" className="py-20 lg:py-28 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1.5" />
              Galeri Rekam Jejak
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Rekam Jejak <span className="text-primary">Pengiriman Proyek</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Dokumentasi nyata pengiriman perangkat IT, instalasi infrastruktur, dan serah terima proyek
              untuk berbagai instansi pemerintah dan perusahaan di seluruh Indonesia.
            </p>
          </motion.div>

          {/* Carousel Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                aria-label="Slide sebelumnya"
                className="rounded-full w-10 h-10 border-border hover:border-primary hover:text-primary transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-xs font-medium text-muted-foreground px-1">
                <span className="text-foreground font-bold">{currentIndex + 1}</span> / {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                aria-label="Slide berikutnya"
                className="rounded-full w-10 h-10 border-border hover:border-primary hover:text-primary transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* ─── Carousel: 2 Kolom, 1 Baris ─── */}
        <div
          className="relative overflow-hidden min-h-[460px] sm:min-h-[440px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className={`grid grid-cols-1 ${displayCards.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-6 lg:gap-8`}
            >
              {displayCards.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-border/80 bg-card/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Gambar Proyek */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] font-medium shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Dokumentasi Resmi
                      </Badge>
                    </div>
                  </div>

                  {/* Konten Judul & Komentar */}
                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg sm:text-xl mb-3 line-clamp-2 break-words leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>

                      {item.comment ? (
                        <div className="relative rounded-xl bg-muted/40 p-4 border border-border/60">
                          <div className="flex items-start gap-2.5">
                            <MessageSquareQuote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic whitespace-normal break-words [overflow-wrap:anywhere]">
                              &ldquo;{item.comment}&rdquo;
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-muted/20 p-3.5 border border-dashed text-xs text-muted-foreground italic text-center">
                          Pengiriman dan serah terima proyek telah diselesaikan dengan baik.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> Rekam Jejak Terverifikasi
                      </span>
                      <span className="font-mono text-[11px] opacity-70">PT INDIO</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Pagination Dots & Progress Indicator */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1)
                    setCurrentIndex(idx)
                  }}
                  aria-label={`Ke slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Slide berganti otomatis setiap 5 detik • Arahkan kursor untuk menjeda
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
