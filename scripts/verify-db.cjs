const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const tables = await p.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  )
  console.log('Tables:', tables.map((t) => t.table_name).join(', '))

  const admin = await p.staff.findUnique({ where: { username: 'admin' } })
  console.log('Admin:', admin ? `${admin.name} (${admin.role})` : 'NOT FOUND')
  console.log('Password hash prefix:', admin?.passwordHash?.slice(0, 7))

  const company = await p.company.findFirst()
  console.log('Company:', company?.name)
}

main()
  .catch((e) => { console.error('ERR:', e.message); process.exit(1) })
  .finally(() => p.$disconnect())
