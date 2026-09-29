require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const sql = fs.readFileSync('./db/rab-dinamis-migration.sql', 'utf-8');

// Use the pooler URL which we know works
const prisma = new PrismaClient({
  datasources: { 
    db: { 
      url: process.env.DATABASE_URL 
    }
  },
});

async function main() {
  console.log('Running RAB Dinamis migration via Prisma $executeRawUnsafe...\n');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => {
      // Remove single-line comments
      return s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
    })
    .filter(s => s.length > 0);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.replace(/\s/g, '').length === 0) continue;
    
    // Skip SELECT statements
    if (stmt.trim().toUpperCase().startsWith('SELECT')) {
      console.log(`[${i+1}] Skipped SELECT statement`);
      continue;
    }
    
    try {
      await prisma.$executeRawUnsafe(stmt);
      successCount++;
      // Print first 80 chars of statement for identification
      const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 80);
      console.log(`[${i+1}] ✓ ${preview}...`);
    } catch(e) {
      errorCount++;
      const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 60);
      console.log(`[${i+1}] ✗ FAILED: ${preview}... | ${e.message.split('\n')[0]}`);
    }
  }
  
  console.log(`\n--- Migration complete ---`);
  console.log(`✓ ${successCount} statements succeeded`);
  console.log(`✗ ${errorCount} statements failed`);
  
  // Verify new tables
  console.log('\n--- Verifying tables ---');
  const tables = ['rABTopik', 'rABItem', 'rABRealisasi', 'rABAuditLog'];
  for (const table of tables) {
    try {
      const count = await prisma[table].count();
      console.log(`✓ ${table}: accessible (${count} rows)`);
    } catch(e) {
      console.log(`✗ ${table}: ${e.message.split('\n')[0]}`);
    }
  }
  
  try {
    const p = await prisma.project.findFirst({ select: { contractValue: true, ppnFromClient: true }});
    console.log('✓ Project.contractValue and ppnFromClient: accessible');
  } catch(e) {
    console.log('✗ Project new fields:', e.message.split('\n')[0]);
  }
  
  try {
    const v = await prisma.vendor.findFirst({ select: { npwp: true, isPKP: true }});
    console.log('✓ Vendor.npwp and isPKP: accessible');
  } catch(e) {
    console.log('✗ Vendor new fields:', e.message.split('\n')[0]);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
