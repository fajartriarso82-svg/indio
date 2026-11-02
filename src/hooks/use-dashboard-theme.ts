'use client'

import { useState, useEffect, useCallback } from 'react'

export type DashboardTheme = 'light' | 'dark'

// v2 key ensures existing browsers default to 'dark' as requested
const THEME_STORAGE_KEY = 'indio_dashboard_theme_v2'
const THEME_EVENT_NAME = 'indio-dashboard-theme-change'

export function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as DashboardTheme | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
      } else {
        // Default to dark theme
        localStorage.setItem(THEME_STORAGE_KEY, 'dark')
        setThemeState('dark')
      }
    } catch {
      // ignore storage errors
    }

    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardTheme>
      if (customEvent.detail === 'dark' || customEvent.detail === 'light') {
        setThemeState(customEvent.detail)
      }
    }

    window.addEventListener(THEME_EVENT_NAME, handleThemeEvent)
    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleThemeEvent)
    }
  }, [])

  const setTheme = useCallback((nextTheme: DashboardTheme) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      window.dispatchEvent(new CustomEvent<DashboardTheme>(THEME_EVENT_NAME, { detail: nextTheme }))
    } catch {
      // ignore storage errors
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    mounted,
  }
}
