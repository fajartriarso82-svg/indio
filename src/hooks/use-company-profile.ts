'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Data profil perusahaan yang aman dipakai di halaman publik (home).
 * Diambil dari endpoint publik `/api/company/public`.
 */
export interface CompanyProfile {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoFile?: string | null
  siplahUrl?: string | null
  ekatalogUrl?: string | null
  padiUmkmUrl?: string | null
  siplahIcon?: string | null
  ekatalogIcon?: string | null
  padiUmkmIcon?: string | null
}

/**
 * Mengambil profil perusahaan (termasuk logo yang diunggah di menu Setting)
 * untuk dipakai di halaman publik/home.
 */
export function useCompanyProfile() {
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/company/public')
      if (!res.ok) {
        setCompany(null)
        return
      }
      const data = await res.json()
      setCompany(data?.success && data.data ? data.data : null)
    } catch {
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { company, loading, refresh }
}
