import { defineConfig } from 'prisma/config'
import { config as loadEnv } from 'dotenv'

/**
 * Prisma config (Prisma 6.16+).
 * Replaces the deprecated `package.json#prisma` configuration.
 *
 * NOTE: When a prisma.config.ts exists, Prisma no longer auto-loads `.env`,
 * so we load it explicitly here.
 */
loadEnv({ path: '.env' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.cjs',
  },
})
