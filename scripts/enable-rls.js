const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('--- Mengaktifkan Row Level Security (RLS) pada semua tabel public ---');

  // Ambil semua nama tabel di schema public
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename ASC;
  `);

  console.log(`Ditemukan ${tables.length} tabel di schema public:`);

  for (const t of tables) {
    const tableName = t.tablename;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS enabled: public."${tableName}"`);
    } catch (err) {
      console.error(`  ✗ Gagal mengaktifkan RLS pada public."${tableName}":`, err.message);
    }
  }

  // Verifikasi status RLS
  const verification = await prisma.$queryRawUnsafe(`
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname ASC;
  `);

  console.log('\n--- Verifikasi Status RLS ---');
  let allEnabled = true;
  for (const row of verification) {
    const status = row.rls_enabled ? 'AMAN (RLS Aktif)' : 'PERINGATAN (RLS Non-aktif)';
    console.log(`  - ${row.table_name.padEnd(28)} : ${status}`);
    if (!row.rls_enabled) allEnabled = false;
  }

  if (allEnabled) {
    console.log('\n✅ Semua tabel di schema public sekarang sudah dilindungi dengan Row Level Security (RLS)!');
    console.log('Akses publik via PostgREST / anon key diblokir secara otomatis, sementara akses internal Prisma tetap berjalan normal.');
  } else {
    console.log('\n⚠️ Ada tabel yang belum aktif RLS-nya.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
