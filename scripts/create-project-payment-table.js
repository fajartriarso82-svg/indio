const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjectPayment" (
      "id" TEXT PRIMARY KEY,
      "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
      "type" TEXT NOT NULL DEFAULT 'LUNAS',
      "terminNo" INTEGER,
      "title" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "paymentMethod" TEXT NOT NULL DEFAULT 'TRANSFER',
      "invoiceNumber" TEXT,
      "invoiceUrl" TEXT,
      "proofUrl" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  console.log('ProjectPayment table created or already exists.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
