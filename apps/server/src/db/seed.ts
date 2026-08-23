import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { runMigrations } from './migrate.js';
import { db, sqlite } from './client.js';
import { users, bonds, bondMembers } from './schema.js';
import { bondMeta } from '../lib/bondMeta.js';

async function seed() {
  runMigrations();

  const email1 = 'alex@example.com';
  const email2 = 'sam@example.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const alexId = nanoid();
  const samId = nanoid();

  db.insert(users)
    .values([
      { id: alexId, email: email1, passwordHash, name: 'Alex' },
      { id: samId, email: email2, passwordHash, name: 'Sam' },
    ])
    .run();

  const meta = bondMeta('couple');
  const bondId = nanoid();
  db.insert(bonds)
    .values({
      id: bondId,
      type: 'couple',
      label: meta.label,
      accent: meta.theme.accent,
      accentSoft: meta.theme.accentSoft,
      accentStrong: meta.theme.accentStrong,
      inviteCode: nanoid(8).toUpperCase(),
      createdBy: alexId,
    })
    .run();

  db.insert(bondMembers)
    .values([
      { id: nanoid(), bondId, userId: alexId },
      { id: nanoid(), bondId, userId: samId },
    ])
    .run();

  console.log('Seeded demo data:');
  console.log(`  ${email1} / ${password}`);
  console.log(`  ${email2} / ${password}`);
  console.log(`  shared bond: ${meta.label} (${bondId})`);

  sqlite.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
