import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'pidibox.db' // Berkas database SQLite lokal di VPS Anda
  },
  verbose: true,
  strict: true
});