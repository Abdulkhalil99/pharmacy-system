import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const cliDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!cliDatabaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be set before running Prisma CLI commands.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Prefer the direct connection for CLI operations like migrations.
    url: cliDatabaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },
});
