import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/database/src/schema',
  out: './libs/database/src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
