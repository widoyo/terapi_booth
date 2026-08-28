import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const sqlite = new Database('pidibox.db');
const db = drizzle(sqlite);

console.log('Menjalankan migrasi Drizzle...');

try {
  migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrasi berhasil dieksekusi!');
} catch (error) {
  console.error('Gagal menjalankan migrasi:', error);
} finally {
  sqlite.close();
}