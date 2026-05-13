'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Wrench,
  Server,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Award,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/* ──────────────────────── Navigation ──────────────────────── */
function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Partners', href: '#partners' },
    { label: 'Clients', href: '#clients' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IN</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-sm leading-tight transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                PT INDO
              </span>
              <span className={`text-[10px] leading-tight transition-colors ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}>
                Optima
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-primary/10 ${
                  scrolled
                    ? 'text-foreground/80 hover:text-primary'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            {/* Hidden Staff Login */}
            <a
              href="#staff-login"
              className={`px-2 py-1 text-[10px] font-normal rounded transition-all opacity-30 hover:opacity-100 ${
                scrolled
                  ? 'text-muted-foreground hover:text-primary'
                  : 'text-white/40 hover:text-white/90'
              }`}
              title="Staff Login"
            >
              <Lock className="w-3 h-3 inline mr-0.5" />
              Staff
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={`lg:hidden p-2 rounded-md transition-colors ${
              scrolled ? 'text-foreground' : 'text-white'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#staff-login"
                className="block px-3 py-2.5 text-[11px] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                onClick={() => setMobileOpen(false)}
              >
                <Lock className="w-3 h-3 inline mr-1" />
                Staff Login
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ──────────────────────── Hero Section ──────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt="Technology infrastructure"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-primary/40 text-primary-foreground bg-primary/20 backdrop-blur-sm"
            >
              <Globe className="w-3 h-3 mr-1.5" />
              Trusted IT Partner Since Cilacap
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Powering Your Digital
            <br />
            <span className="text-primary">Infrastructure</span> Forward
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed"
          >
            From IT procurement to infrastructure deployment and security systems — 
            we deliver end-to-end technology solutions that keep your business running 
            without compromise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base" asChild>
              <a href="#contact">
                Get a Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base"
              asChild
            >
              <a href="#services">Explore Services</a>
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="flex flex-wrap gap-8 sm:gap-12 mt-16 pt-8 border-t border-white/10"
          >
            {[
              { value: '10+', label: 'Years Experience' },
              { value: '150+', label: 'Projects Delivered' },
              { value: '50+', label: 'Corporate Clients' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  )
}

/* ──────────────────────── About Section ──────────────────────── */
function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
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

          {/* Right: Feature cards */}
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

/* ──────────────────────── Services Section ──────────────────────── */
function ServicesSection() {
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
      image: '/images/service-maintenance.png',
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
      image: '/images/service-cctv.png',
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
                {/* Image header */}
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

/* ──────────────────────── Projects Section ──────────────────────── */
function ProjectsSection() {
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

        {/* Two column cards */}
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

        {/* Highlight list */}
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

/* ──────────────────────── Partners Section ──────────────────────── */
function PartnersSection() {
  const partners = [
    {
      name: 'Siplah',
      description: 'Government e-Procurement Platform',
      detail: 'Official partner for government school & institution IT procurement through the Siplah marketplace.',
      logo: 'Siplah',
    },
    {
      name: 'eKatalog',
      description: 'LKPP e-Catalogue System',
      detail: 'Registered vendor on the national e-catalogue for transparent, compliant government procurement.',
      logo: 'eKatalog',
    },
    {
      name: 'Padi UMKM',
      description: 'MSME Digital Platform',
      detail: 'Supporting digital transformation of micro, small & medium enterprises through the Padi UMKM ecosystem.',
      logo: 'Padi UMKM',
    },
  ]

  return (
    <section id="partners" className="py-20 lg:py-28 bg-muted/50">
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
            Official Partnerships
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Licensed <span className="text-primary">Procurement Channels</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Officially registered on national procurement platforms, ensuring transparent, 
            compliant, and streamlined purchasing for government and institutional clients.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <Card className="group text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="p-6 lg:p-8">
                  {/* Logo placeholder */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                    <span className="text-2xl font-bold text-primary">{partner.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{partner.name}</h3>
                  <p className="text-xs text-primary font-medium mb-3">{partner.description}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{partner.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── Clients Section ──────────────────────── */
function ClientsSection() {
  const clients = [
    {
      name: 'Pertamina Cilacap',
      type: 'State-Owned Enterprise',
      description: 'Refinery & energy infrastructure IT solutions',
      icon: Building2,
    },
    {
      name: 'PT SBI — Cilacap',
      type: 'Industrial',
      description: 'Industrial IT systems & security deployment',
      icon: Building2,
    },
    {
      name: 'PT SBI — Narogong',
      type: 'Industrial',
      description: 'Cross-site infrastructure standardization',
      icon: Building2,
    },
    {
      name: 'PT SBI — Tuban',
      type: 'Industrial',
      description: 'Facility-wide CCTV & network deployment',
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
            Key Clients
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by <span className="text-primary">Industry Leaders</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From state-owned energy giants to major industrial players — 
            our clients trust us with their most critical IT operations.
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

/* ──────────────────────── CTA Section ──────────────────────── */
function CTASection() {
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
              {/* Left side - CTA */}
              <div className="lg:col-span-3 p-8 lg:p-12 bg-gradient-to-br from-primary to-primary/80 flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                  Ready to Upgrade Your IT Infrastructure?
                </h2>
                <p className="text-primary-foreground/80 mb-8 leading-relaxed max-w-lg">
                  Whether you need a complete server room setup, CCTV installation, 
                  or IT equipment procurement — our team is ready to deliver. Contact us 
                  for a free consultation and let's build your technology roadmap together.
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

              {/* Right side - Contact info */}
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

/* ──────────────────────── Footer ──────────────────────── */
function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IN</span>
              </div>
              <div>
                <p className="font-bold text-sm text-primary-foreground">PT INDO</p>
                <p className="text-[10px] text-primary-foreground/50">Optima</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60 leading-relaxed max-w-xs">
              PT Inti Nusa Dinamika Optima — Your trusted IT solutions partner 
              delivering reliable technology infrastructure from Cilacap to across Indonesia.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Services</h4>
            <ul className="space-y-2">
              {['IT Product Sales', 'Service & Maintenance', 'Infrastructure Solutions', 'Security Systems'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#services"
                      className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Our Projects', href: '#projects' },
                { label: 'Partners', href: '#partners' },
                { label: 'Contact', href: '#contact' },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-primary-foreground mb-4">Contact</h4>
            <div className="space-y-2">
              <p className="text-xs text-primary-foreground/60">
                Jl. Jend. Ahmad Yani No.77, Cilacap
              </p>
              <p className="text-xs text-primary-foreground/60">(0282) 123-4567</p>
              <p className="text-xs text-primary-foreground/60">info@intinusadinamika.co.id</p>
            </div>
          </div>
        </div>

        <Separator className="bg-primary-foreground/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} PT Inti Nusa Dinamika Optima. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#staff-login"
              className="text-[10px] text-primary-foreground/20 hover:text-primary-foreground/60 transition-all"
            >
              Staff Login
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ──────────────────────── Main Page ──────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <PartnersSection />
        <ClientsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
