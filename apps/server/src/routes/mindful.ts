import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { mindfulLogs } from '../db/schema.js';
import { asyncHandler, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const mindfulRouter = Router({ mergeParams: true });
mindfulRouter.use(requireAuth, requireBondMember);

mindfulRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db.select().from(mindfulLogs).where(eq(mindfulLogs.bondId, req.bondId!)).all();
    res.json(rows);
  }),
);

const createSchema = z.object({ sessionId: z.string().min(1).max(100) });

mindfulRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body as z.infer<typeof createSchema>;
    const id = nanoid();
    db.insert(mindfulLogs).values({ id, bondId: req.bondId!, personId: req.userId!, sessionId }).run();
    const row = db.select().from(mindfulLogs).where(eq(mindfulLogs.id, id)).get()!;
    emitToBond(req.bondId!, 'mindful:logged', row);
    res.status(201).json(row);
  }),
);
