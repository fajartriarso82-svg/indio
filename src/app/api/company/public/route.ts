import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Profil perusahaan untuk halaman publik (home/landing).
 *
 * Endpoint ini TIDAK memerlukan autentikasi (lihat whitelist di src/proxy.ts)
 * sehingga hanya mengembalikan field yang aman ditampilkan ke publik:
 * nama, alamat, telepon, email, dan logo.
 *
 * Dokumen legalitas (NPWP/NIB/Akta/Kop) sengaja TIDAK diikutsertakan.
 */
export async function GET() {
  try {
    const company = await db.company.findFirst({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoFile: true,
        siplahUrl: true,
        ekatalogUrl: true,
        padiUmkmUrl: true,
      },
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error) {
    console.error('Error fetching public company profile:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat profil perusahaan' },
      { status: 500 }
    )
  }
}
