import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const id = () => text('id').primaryKey();
const createdAt = () => text('created_at').notNull().default(sql`(current_timestamp)`);

export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: createdAt(),
});

export const bonds = sqliteTable('bonds', {
  id: id(),
  type: text('type').notNull(),
  label: text('label').notNull(),
  accent: text('accent').notNull(),
  accentSoft: text('accent_soft').notNull(),
  accentStrong: text('accent_strong').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const bondMembers = sqliteTable(
  'bond_members',
  {
    id: id(),
    bondId: text('bond_id')
      .notNull()
      .references(() => bonds.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: createdAt(),
  },
  (t) => ({ bondUserIdx: uniqueIndex('bond_members_bond_user_idx').on(t.bondId, t.userId) }),
);

export const checkIns = sqliteTable('check_ins', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  personId: text('person_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  mood: integer('mood').notNull(),
  note: text('note').notNull().default(''),
  visibility: text('visibility').notNull().default('shared'),
  createdAt: createdAt(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  prompt: text('prompt').notNull(),
  content: text('content').notNull(),
  visibility: text('visibility').notNull().default('shared'),
  createdAt: createdAt(),
});

export const vaultEntries = sqliteTable('vault_entries', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  personId: text('person_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  content: text('content').notNull(),
  visibility: text('visibility').notNull().default('private'),
  createdAt: createdAt(),
});

export const goals = sqliteTable('goals', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id'), // null/'shared' sentinel handled in app layer
  title: text('title').notNull(),
  progress: integer('progress').notNull().default(0),
  createdAt: createdAt(),
});

export const goalCheers = sqliteTable(
  'goal_cheers',
  {
    id: id(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => ({ goalPersonIdx: uniqueIndex('goal_cheers_goal_person_idx').on(t.goalId, t.personId) }),
);

export const weeklyPulses = sqliteTable(
  'weekly_pulses',
  {
    id: id(),
    bondId: text('bond_id')
      .notNull()
      .references(() => bonds.id, { onDelete: 'cascade' }),
    weekOf: text('week_of').notNull(),
    createdAt: createdAt(),
  },
  (t) => ({ bondWeekIdx: uniqueIndex('weekly_pulses_bond_week_idx').on(t.bondId, t.weekOf) }),
);

export const weeklyResponses = sqliteTable(
  'weekly_responses',
  {
    id: id(),
    pulseId: text('pulse_id')
      .notNull()
      .references(() => weeklyPulses.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    appreciation: text('appreciation').notNull().default(''),
    friction: text('friction').notNull().default(''),
    request: text('request').notNull().default(''),
    win: text('win').notNull().default(''),
    tryThis: text('try_this').notNull().default(''),
    submittedAt: createdAt(),
  },
  (t) => ({ pulsePersonIdx: uniqueIndex('weekly_responses_pulse_person_idx').on(t.pulseId, t.personId) }),
);

export const events = sqliteTable('events', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  type: text('type').notNull(),
  notes: text('notes'),
  createdAt: createdAt(),
});

export const mindfulLogs = sqliteTable('mindful_logs', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  personId: text('person_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  completedAt: createdAt(),
});

export const supportSignals = sqliteTable('support_signals', {
  id: id(),
  bondId: text('bond_id')
    .notNull()
    .references(() => bonds.id, { onDelete: 'cascade' }),
  personId: text('person_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
});
