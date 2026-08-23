import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { goals, goalCheers } from '../db/schema.js';
import { asyncHandler, HttpError, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const goalsRouter = Router({ mergeParams: true });
goalsRouter.use(requireAuth, requireBondMember);

async function serializeGoal(goal: typeof goals.$inferSelect) {
  const cheers = db.select({ personId: goalCheers.personId }).from(goalCheers).where(eq(goalCheers.goalId, goal.id)).all();
  return { ...goal, cheers: cheers.map((c) => c.personId) };
}

goalsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db.select().from(goals).where(eq(goals.bondId, req.bondId!)).orderBy(desc(goals.createdAt)).all();
    res.json(await Promise.all(rows.map(serializeGoal)));
  }),
);

const createSchema = z.object({
  title: z.string().min(1).max(300),
  ownerId: z.union([z.literal('shared'), z.string()]),
});

goalsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { title, ownerId } = req.body as z.infer<typeof createSchema>;
    const id = nanoid();
    db.insert(goals)
      .values({ id, bondId: req.bondId!, title, ownerId: ownerId === 'shared' ? null : ownerId, progress: 0 })
      .run();
    const row = db.select().from(goals).where(eq(goals.id, id)).get()!;
    const serialized = await serializeGoal(row);
    emitToBond(req.bondId!, 'goal:new', serialized);
    res.status(201).json(serialized);
  }),
);

const progressSchema = z.object({ progress: z.number().int().min(0).max(100) });

goalsRouter.patch(
  '/:goalId',
  validateBody(progressSchema),
  asyncHandler(async (req, res) => {
    const goal = db
      .select()
      .from(goals)
      .where(and(eq(goals.id, req.params.goalId), eq(goals.bondId, req.bondId!)))
      .get();
    if (!goal) throw new HttpError(404, 'Goal not found');

    const { progress } = req.body as z.infer<typeof progressSchema>;
    db.update(goals).set({ progress }).where(eq(goals.id, goal.id)).run();
    const row = db.select().from(goals).where(eq(goals.id, goal.id)).get()!;
    const serialized = await serializeGoal(row);
    emitToBond(req.bondId!, 'goal:update', serialized);
    res.json(serialized);
  }),
);

goalsRouter.post(
  '/:goalId/cheer',
  asyncHandler(async (req, res) => {
    const goal = db
      .select()
      .from(goals)
      .where(and(eq(goals.id, req.params.goalId), eq(goals.bondId, req.bondId!)))
      .get();
    if (!goal) throw new HttpError(404, 'Goal not found');

    const already = db
      .select()
      .from(goalCheers)
      .where(and(eq(goalCheers.goalId, goal.id), eq(goalCheers.personId, req.userId!)))
      .get();
    if (!already) {
      db.insert(goalCheers).values({ id: nanoid(), goalId: goal.id, personId: req.userId! }).run();
    }
    const serialized = await serializeGoal(goal);
    emitToBond(req.bondId!, 'goal:cheer', serialized);
    res.json(serialized);
  }),
);
