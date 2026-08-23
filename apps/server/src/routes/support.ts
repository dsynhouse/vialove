import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { supportSignals, users } from '../db/schema.js';
import { asyncHandler } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const supportRouter = Router({ mergeParams: true });
supportRouter.use(requireAuth, requireBondMember);

supportRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .select({ id: supportSignals.id, personId: supportSignals.personId, createdAt: supportSignals.createdAt })
      .from(supportSignals)
      .where(eq(supportSignals.bondId, req.bondId!))
      .orderBy(desc(supportSignals.createdAt))
      .limit(20)
      .all();
    res.json(rows);
  }),
);

supportRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const id = nanoid();
    db.insert(supportSignals).values({ id, bondId: req.bondId!, personId: req.userId! }).run();
    const sender = db.select({ name: users.name }).from(users).where(eq(users.id, req.userId!)).get();
    const row = db.select().from(supportSignals).where(eq(supportSignals.id, id)).get()!;
    emitToBond(req.bondId!, 'support:signal', { ...row, name: sender?.name });
    res.status(201).json(row);
  }),
);
