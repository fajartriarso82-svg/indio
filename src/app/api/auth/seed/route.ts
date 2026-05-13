import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST() {
  try {
    // Check if admin already exists
    const existing = await db.staff.findUnique({ where: { username: 'admin' } })
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        staff: { username: 'admin', name: existing.name, role: existing.role },
      })
    }

    const passwordHash = await hashPassword('admin123')

    const staff = await db.staff.create({
      data: {
        username: 'admin',
        passwordHash,
        name: 'Administrator',
        role: 'admin',
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      staff: { username: 'admin', name: staff.name, role: staff.role },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed admin user' },
      { status: 500 }
    )
  }
}
