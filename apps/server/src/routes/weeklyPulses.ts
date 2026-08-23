import { Router } from 'express';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { weeklyPulses, weeklyResponses } from '../db/schema.js';
import { asyncHandler, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { emitToBond } from '../realtime.js';

export const weeklyPulsesRouter = Router({ mergeParams: true });
weeklyPulsesRouter.use(requireAuth, requireBondMember);

function responsesFor(pulseId: string) {
  return db.select().from(weeklyResponses).where(eq(weeklyResponses.pulseId, pulseId)).all();
}

// Past weeks: fully revealed (history). Current week is fetched via the :weekOf route below,
// which applies the blind-until-both-submit rule.
weeklyPulsesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const currentWeekOf = String(req.query.currentWeekOf ?? '');
    const pulses = db
      .select()
      .from(weeklyPulses)
      .where(
        currentWeekOf
          ? and(eq(weeklyPulses.bondId, req.bondId!), ne(weeklyPulses.weekOf, currentWeekOf))
          : eq(weeklyPulses.bondId, req.bondId!),
      )
      .all();

    const result = pulses.map((p) => ({
      id: p.id,
      weekOf: p.weekOf,
      responses: Object.fromEntries(responsesFor(p.id).map((r) => [r.personId, r])),
    }));
    res.json(result);
  }),
);

weeklyPulsesRouter.get(
  '/:weekOf',
  asyncHandler(async (req, res) => {
    const pulse = db
      .select()
      .from(weeklyPulses)
      .where(and(eq(weeklyPulses.bondId, req.bondId!), eq(weeklyPulses.weekOf, req.params.weekOf)))
      .get();

    if (!pulse) {
      res.json({ weekOf: req.params.weekOf, responses: {} });
      return;
    }

    const all = responsesFor(pulse.id);
    const mine = all.find((r) => r.personId === req.userId);
    const visible = mine ? all : all.filter((r) => r.personId === req.userId);
    res.json({
      weekOf: pulse.weekOf,
      responses: Object.fromEntries(visible.map((r) => [r.personId, r])),
    });
  }),
);

const responseSchema = z.object({
  appreciation: z.string().max(2000).default(''),
  friction: z.string().max(2000).default(''),
  request: z.string().max(2000).default(''),
  win: z.string().max(2000).default(''),
  tryThis: z.string().max(2000).default(''),
});

weeklyPulsesRouter.post(
  '/:weekOf/responses',
  validateBody(responseSchema),
  asyncHandler(async (req, res) => {
    const weekOf = req.params.weekOf;
    let pulse = db
      .select()
      .from(weeklyPulses)
      .where(and(eq(weeklyPulses.bondId, req.bondId!), eq(weeklyPulses.weekOf, weekOf)))
      .get();

    if (!pulse) {
      const id = nanoid();
      db.insert(weeklyPulses).values({ id, bondId: req.bondId!, weekOf }).run();
      pulse = db.select().from(weeklyPulses).where(eq(weeklyPulses.id, id)).get()!;
    }

    const data = req.body as z.infer<typeof responseSchema>;
    const existing = db
      .select()
      .from(weeklyResponses)
      .where(and(eq(weeklyResponses.pulseId, pulse.id), eq(weeklyResponses.personId, req.userId!)))
      .get();

    if (existing) {
      db.update(weeklyResponses).set(data).where(eq(weeklyResponses.id, existing.id)).run();
    } else {
      db.insert(weeklyResponses)
        .values({ id: nanoid(), pulseId: pulse.id, personId: req.userId!, ...data })
        .run();
    }

    // Don't leak the content of the response — just that this person has submitted.
    emitToBond(req.bondId!, 'pulse:submitted', { weekOf, personId: req.userId });
    res.status(201).json({ ok: true });
  }),
);
