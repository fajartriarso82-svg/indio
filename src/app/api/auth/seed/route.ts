import { NextResponse } from 'next/server'

/**
 * SEED ROUTE — DISABLED.
 *
 * Membuat akun admin via endpoint HTTP adalah celah keamanan serius:
 * siapa pun bisa memanggil endpoint ini dan membuat/menimpa akun admin.
 *
 * Gunakan seed CLI sebagai gantinya:
 *   npm run db:seed
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Seed endpoint is disabled. Use "npm run db:seed" instead.' },
    { status: 404 }
  )
}
