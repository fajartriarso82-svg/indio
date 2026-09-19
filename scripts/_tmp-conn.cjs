const net = require('net')
const { PrismaClient } = require('@prisma/client')

function tryConnect(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port })
    const done = (ok, msg) => {
      s.destroy()
      resolve(`${host}:${port} -> ${ok ? 'OK' : 'FAIL'} ${msg || ''}`)
    }
    s.setTimeout(timeout)
    s.on('connect', () => done(true))
    s.on('timeout', () => done(false, '(timeout)'))
    s.on('error', (e) => done(false, `(${e.code})`))
  })
}

async function main() {
  const u1 = new URL(process.env.DATABASE_URL)
  const u2 = new URL(process.env.DIRECT_URL)
  console.log(await tryConnect(u1.hostname, Number(u1.port)))
  console.log(await tryConnect(u2.hostname, Number(u2.port)))

  const p = new PrismaClient()
  try {
    const cols = await p.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = '_prisma_migrations' ORDER BY ordinal_position"
    )
    console.log('_prisma_migrations columns ->', cols.map((c) => c.column_name).join(', ') || '(table missing)')

    const rows = await p.$queryRawUnsafe(
      'SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at'
    )
    for (const r of rows) {
      console.log('MIGRATION ->', r.migration_name, '| finished:', !!r.finished_at, '| steps:', r.applied_steps_count, '| checksum:', String(r.checksum).slice(0, 12))
    }

    const tables = await p.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('RABTopic','PurchaseOrder','Payment','AuditLog') ORDER BY table_name"
    )
    console.log('New tables already present ->', tables.map((t) => t.table_name).join(', ') || '(none)')
  } finally {
    await p.$disconnect()
  }
}

main().catch((e) => {
  console.error('ERR:', e.message.split('\n')[0])
  process.exit(1)
})
