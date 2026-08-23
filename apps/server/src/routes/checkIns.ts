import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { checkIns } from '../db/schema.js';
import { asyncHandler, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const checkInsRouter = Router({ mergeParams: true });
checkInsRouter.use(requireAuth, requireBondMember);

checkInsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .select()
      .from(checkIns)
      .where(
        and(
          eq(checkIns.bondId, req.bondId!),
          or(eq(checkIns.personId, req.userId!), eq(checkIns.visibility, 'shared')),
        ),
      )
      .orderBy(desc(checkIns.createdAt))
      .all();
    res.json(rows);
  }),
);

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional().default(''),
  visibility: z.enum(['private', 'shared']),
});

checkInsRouter.post(
  '/',
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => {
    const { date, mood, note, visibility } = req.body as z.infer<typeof upsertSchema>;
    const existing = db
      .select()
      .from(checkIns)
      .where(
        and(eq(checkIns.bondId, req.bondId!), eq(checkIns.personId, req.userId!), eq(checkIns.date, date)),
      )
      .get();

    let row: typeof checkIns.$inferSelect;
    if (existing) {
      db.update(checkIns).set({ mood, note, visibility }).where(eq(checkIns.id, existing.id)).run();
      row = { ...existing, mood, note, visibility };
    } else {
      const id = nanoid();
      db.insert(checkIns)
        .values({ id, bondId: req.bondId!, personId: req.userId!, date, mood, note, visibility })
        .run();
      row = db.select().from(checkIns).where(eq(checkIns.id, id)).get()!;
    }

    emitToBond(req.bondId!, 'checkin:saved', row);
    res.status(existing ? 200 : 201).json(row);
  }),
);
