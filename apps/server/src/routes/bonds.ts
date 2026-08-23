import { Router } from 'express';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { bonds, bondMembers, users } from '../db/schema.js';
import { asyncHandler, HttpError, validateBody } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { bondMeta, isBondType } from '../lib/bondMeta.js';

export const bondsRouter = Router();
bondsRouter.use(requireAuth);

function serializeBond(
  bond: typeof bonds.$inferSelect,
  members: { id: string; name: string }[],
) {
  return {
    id: bond.id,
    type: bond.type,
    label: bond.label,
    theme: { accent: bond.accent, accentSoft: bond.accentSoft, accentStrong: bond.accentStrong },
    inviteCode: bond.inviteCode,
    members,
    createdAt: bond.createdAt,
  };
}

async function membersFor(bondId: string) {
  const rows = db
    .select({ id: users.id, name: users.name })
    .from(bondMembers)
    .innerJoin(users, eq(users.id, bondMembers.userId))
    .where(eq(bondMembers.bondId, bondId))
    .all();
  return rows;
}

bondsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const myMemberships = db
      .select({ bondId: bondMembers.bondId })
      .from(bondMembers)
      .where(eq(bondMembers.userId, req.userId!))
      .all();
    const bondIds = myMemberships.map((m) => m.bondId);
    if (bondIds.length === 0) {
      res.json([]);
      return;
    }
    const myBonds = db.select().from(bonds).where(inArray(bonds.id, bondIds)).orderBy(bonds.createdAt).all();
    const result = await Promise.all(myBonds.map(async (b) => serializeBond(b, await membersFor(b.id))));
    res.json(result);
  }),
);

const createBondSchema = z.object({
  type: z.string().refine(isBondType, { message: 'Unknown bond type' }),
  label: z.string().trim().min(1).max(60).optional(),
});

bondsRouter.post(
  '/',
  validateBody(createBondSchema),
  asyncHandler(async (req, res) => {
    const { type, label } = req.body as z.infer<typeof createBondSchema>;
    const meta = bondMeta(type);
    const id = nanoid();
    const inviteCode = nanoid(8).toUpperCase();

    db.insert(bonds)
      .values({
        id,
        type,
        label: label || meta.label,
        accent: meta.theme.accent,
        accentSoft: meta.theme.accentSoft,
        accentStrong: meta.theme.accentStrong,
        inviteCode,
        createdBy: req.userId!,
      })
      .run();

    db.insert(bondMembers).values({ id: nanoid(), bondId: id, userId: req.userId! }).run();

    const bond = db.select().from(bonds).where(eq(bonds.id, id)).get()!;
    res.status(201).json(serializeBond(bond, await membersFor(id)));
  }),
);

const joinBondSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase()),
});

bondsRouter.post(
  '/join',
  validateBody(joinBondSchema),
  asyncHandler(async (req, res) => {
    const { inviteCode } = req.body as z.infer<typeof joinBondSchema>;
    const bond = db.select().from(bonds).where(eq(bonds.inviteCode, inviteCode)).get();
    if (!bond) throw new HttpError(404, 'No bond found for that invite code');

    const existingMembers = await membersFor(bond.id);
    if (existingMembers.some((m) => m.id === req.userId)) {
      res.json(serializeBond(bond, existingMembers));
      return;
    }
    if (existingMembers.length >= 2) throw new HttpError(409, 'This bond already has two people in it');

    db.insert(bondMembers).values({ id: nanoid(), bondId: bond.id, userId: req.userId! }).run();
    res.status(201).json(serializeBond(bond, await membersFor(bond.id)));
  }),
);

bondsRouter.get(
  '/:bondId',
  requireBondMember,
  asyncHandler(async (req, res) => {
    const bond = db.select().from(bonds).where(eq(bonds.id, req.bondId!)).get();
    if (!bond) throw new HttpError(404, 'Bond not found');
    res.json(serializeBond(bond, await membersFor(bond.id)));
  }),
);
