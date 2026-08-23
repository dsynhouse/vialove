import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { vaultEntries } from '../db/schema.js';
import { asyncHandler, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const vaultRouter = Router({ mergeParams: true });
vaultRouter.use(requireAuth, requireBondMember);

const CATEGORIES = ['dream', 'aspiration', 'fear', 'worry', 'regret', 'shame', 'goal'] as const;

vaultRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .select()
      .from(vaultEntries)
      .where(
        and(
          eq(vaultEntries.bondId, req.bondId!),
          or(eq(vaultEntries.personId, req.userId!), eq(vaultEntries.visibility, 'shared')),
        ),
      )
      .orderBy(desc(vaultEntries.createdAt))
      .all();
    res.json(rows);
  }),
);

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  content: z.string().min(1).max(5000),
  visibility: z.enum(['private', 'shared']),
});

vaultRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { category, content, visibility } = req.body as z.infer<typeof createSchema>;
    const id = nanoid();
    db.insert(vaultEntries)
      .values({ id, bondId: req.bondId!, personId: req.userId!, category, content, visibility })
      .run();
    const row = db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).get()!;
    if (visibility === 'shared') emitToBond(req.bondId!, 'vault:new', row);
    res.status(201).json(row);
  }),
);
