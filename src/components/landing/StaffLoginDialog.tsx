'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

/* ──────────────────────── Types ──────────────────────── */
export interface StaffUser {
  id: string
  name: string
  username: string
  role: string
  avatar: string | null
}

/* ──────────────────────── Auth Hook ──────────────────────── */
export function useStaffAuth() {
  const [staff, setStaff] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setStaff(data.staff)
        } else {
          setStaff(null)
        }
      } else {
        setStaff(null)
      }
    } catch {
      setStaff(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setStaff(data.staff)
      setShowLogin(false)
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setStaff(null)
  }

  return { staff, loading, showLogin, setShowLogin, login, logout, checkAuth }
}

/* ──────────────────────── Staff Login Dialog ──────────────────────── */
export function StaffLoginDialog({
  open,
  onOpenChange,
  onLogin,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await onLogin(username, password)
      if (!result.success) {
        setError(result.error || 'Gagal login')
      } else {
        toast({
          title: 'Selamat datang!',
          description: 'Anda berhasil masuk.',
        })
        setUsername('')
        setPassword('')
      }
    } catch {
      setError('Terjadi kesalahan tak terduga')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg">Login Staff</DialogTitle>
              <DialogDescription>
                Akses portal staff internal
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Nama Pengguna</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Portal ini hanya untuk staff yang berwenang.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
