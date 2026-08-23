import { Router } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { events } from '../db/schema.js';
import { asyncHandler, HttpError, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const eventsRouter = Router({ mergeParams: true });
eventsRouter.use(requireAuth, requireBondMember);

eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db.select().from(events).where(eq(events.bondId, req.bondId!)).all();
    res.json(rows);
  }),
);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  type: z.enum(['meet-discuss', 'date', 'ritual']),
  notes: z.string().max(2000).optional(),
});

eventsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof createSchema>;
    const id = nanoid();
    db.insert(events)
      .values({ id, bondId: req.bondId!, createdBy: req.userId!, ...data })
      .run();
    const row = db.select().from(events).where(eq(events.id, id)).get()!;
    emitToBond(req.bondId!, 'event:new', row);
    res.status(201).json(row);
  }),
);

eventsRouter.delete(
  '/:eventId',
  asyncHandler(async (req, res) => {
    const row = db
      .select()
      .from(events)
      .where(and(eq(events.id, req.params.eventId), eq(events.bondId, req.bondId!)))
      .get();
    if (!row) throw new HttpError(404, 'Event not found');
    db.delete(events).where(eq(events.id, row.id)).run();
    emitToBond(req.bondId!, 'event:deleted', { id: row.id });
    res.status(204).end();
  }),
);
