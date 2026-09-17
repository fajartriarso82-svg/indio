import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Proxy (Next.js 16+) untuk proteksi API routes yang membutuhkan autentikasi.
 * Berjalan di Node.js runtime (bukan Edge) — sehingga bisa memvalidasi session
 * langsung ke database.
 *
 * Catatan Next.js 16: File ini menggantikan "middleware.ts" yang sudah deprecated.
 * Ref: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * Logika:
 * - Endpoint publik (login, logout, me, root API) → langsung lolos
 * - Semua /api/* lainnya → validasi cookie `staff_token` terhadap DB
 *   - Session valid & belum expired → lolos ke handler
 *   - Cookie tidak ada / tidak valid / expired → return 401 JSON
 */

// Daftar API path yang TIDAK membutuhkan autentikasi
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me', // mengembalikan 200 { authenticated: false } bila tidak ada session valid
  '/api/auth/seed', // tetap di-routing, tapi handler-nya sudah dinonaktifkan
  '/api/company/public', // hanya data publik perusahaan (nama, alamat, telp, email, logo) untuk home page
]

// Path publik yang hanya cocok PERSIS (tidak boleh mencakup sub-path).
// PENTING: jangan pernah memasukkan "/api" ke PUBLIC_API_PATHS — dengan
// pencocokan prefix, "/api" akan membuat SEMUA route /api/* menjadi publik.
const PUBLIC_API_EXACT = ['/api'] // root health check saja

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isApi = pathname.startsWith('/api')
  const isPrint = pathname.startsWith('/print')

  // Hanya proses request ke /api/* dan /print/*
  if (!isApi && !isPrint) {
    return NextResponse.next()
  }

  // Cek apakah ini endpoint publik (hanya relevan untuk /api/*)
  const isPublic = isApi
    ? PUBLIC_API_EXACT.includes(pathname) ||
      PUBLIC_API_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + '/')
      )
    : false

  if (isPublic) {
    return NextResponse.next()
  }

  // Cek keberadaan session cookie
  const token = request.cookies.get('staff_token')?.value

  const unauthorized = () => {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }
    // Untuk halaman (print), arahkan kembali ke beranda
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (!token) {
    return unauthorized()
  }

  // Validasi session ke DB (mencegah pemalsuan cookie)
  try {
    const session = await db.staffSession.findUnique({
      where: { token },
      include: { staff: true },
    })

    if (!session || session.expiresAt < new Date() || !session.staff.isActive) {
      return unauthorized()
    }
  } catch (error) {
    console.error('Proxy session validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }

  // Session valid → lanjutkan request ke handler
  return NextResponse.next()
}

export const config = {
  // Jalankan proxy untuk /api/* dan /print/*
  matcher: ['/api/:path*', '/print/:path*'],
}
