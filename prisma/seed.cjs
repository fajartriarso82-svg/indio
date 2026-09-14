/**
 * Idempotent database seed for Supabase (PostgreSQL).
 *
 * Run: npx prisma db seed
 * - Creates default admin user if missing.
 * - Creates default company profile if missing.
 *
 * Set ADMIN_PASSWORD env var to override the default admin password.
 * Example: ADMIN_PASSWORD=SuperSecret123 npx prisma db seed
 */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const existing = await prisma.staff.findUnique({ where: { username } })

  if (existing) {
    console.log(`ℹ️  Admin user "${username}" already exists, skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.staff.create({
    data: {
      username,
      passwordHash,
      name: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  })
  console.log(`✅ Admin user created ("${username}").`)
}

async function seedCompany() {
  const existing = await prisma.company.findFirst()
  if (existing) {
    console.log('ℹ️  Company profile already exists, skipping.')
    return
  }

  await prisma.company.create({
    data: { name: 'PT Inti Nusa Dinamika Optima' },
  })
  console.log('✅ Company profile created.')
}

async function main() {
  await seedAdmin()
  await seedCompany()
  console.log('🌱 Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
