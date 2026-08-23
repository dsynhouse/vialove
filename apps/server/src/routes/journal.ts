import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { journalEntries } from '../db/schema.js';
import { asyncHandler, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const journalRouter = Router({ mergeParams: true });
journalRouter.use(requireAuth, requireBondMember);

journalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.bondId, req.bondId!),
          or(eq(journalEntries.authorId, req.userId!), eq(journalEntries.visibility, 'shared')),
        ),
      )
      .orderBy(desc(journalEntries.createdAt))
      .all();
    res.json(rows);
  }),
);

const createSchema = z.object({
  kind: z.enum(['reflective', 'fun']),
  prompt: z.string().min(1).max(500),
  content: z.string().min(1).max(5000),
  visibility: z.enum(['private', 'shared']),
});

journalRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { kind, prompt, content, visibility } = req.body as z.infer<typeof createSchema>;
    const id = nanoid();
    db.insert(journalEntries)
      .values({ id, bondId: req.bondId!, authorId: req.userId!, kind, prompt, content, visibility })
      .run();
    const row = db.select().from(journalEntries).where(eq(journalEntries.id, id)).get()!;
    emitToBond(req.bondId!, 'journal:new', row);
    res.status(201).json(row);
  }),
);
