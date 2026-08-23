import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db, sqlite } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
  migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runMigrations();
  console.log('Migrations applied.');
  sqlite.close();
}
