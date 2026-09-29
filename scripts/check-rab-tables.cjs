require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const tables = ['rABTopik', 'rABItem', 'rABRealisasi', 'rABAuditLog'];
  for (const table of tables) {
    try {
      const count = await prisma[table].count();
      console.log(`✓ ${table} exists, count: ${count}`);
    } catch(e) {
      console.log(`✗ ${table} not found: ${e.message.split('\n')[0]}`);
    }
  }
  
  // Test if contractValue column exists on Project
  try {
    const p = await prisma.project.findFirst({ select: { contractValue: true, ppnFromClient: true }});
    console.log('✓ Project.contractValue and ppnFromClient exist');
  } catch(e) {
    console.log('✗ Project fields missing:', e.message.split('\n')[0]);
  }
  
  // Test if Vendor.npwp exists
  try {
    const v = await prisma.vendor.findFirst({ select: { npwp: true, isPKP: true }});
    console.log('✓ Vendor.npwp and isPKP exist');
  } catch(e) {
    console.log('✗ Vendor fields missing:', e.message.split('\n')[0]);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
