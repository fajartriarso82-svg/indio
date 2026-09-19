import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('staff_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' },
        { status: 401 }
      )
    }

    const session = await db.staffSession.findUnique({
      where: { token },
      include: { staff: true },
    })

    if (!session || session.expiresAt < new Date() || !session.staff.isActive) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid atau telah kedaluwarsa.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom password wajib diisi.' },
        { status: 400 }
      )
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password baru minimal harus 6 karakter.' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Konfirmasi password baru tidak cocok.' },
        { status: 400 }
      )
    }

    // Verifikasi password saat ini
    const isValid = await verifyPassword(currentPassword, session.staff.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini salah.' },
        { status: 400 }
      )
    }

    // Cegah password baru sama dengan password lama
    const isSamePassword = await verifyPassword(newPassword, session.staff.passwordHash)
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'Password baru tidak boleh sama dengan password saat ini.' },
        { status: 400 }
      )
    }

    // Hash password baru dan simpan ke database
    const newPasswordHash = await hashPassword(newPassword)
    await db.staff.update({
      where: { id: session.staff.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui.',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat mengubah password.' },
      { status: 500 }
    )
  }
}
