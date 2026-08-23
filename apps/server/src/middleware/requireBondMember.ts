import type { Request, Response, NextFunction } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { bondMembers } from '../db/schema.js';

export async function requireBondMember(req: Request, res: Response, next: NextFunction) {
  const bondId = req.params.bondId;
  if (!bondId) {
    res.status(400).json({ error: 'Missing bondId' });
    return;
  }
  const membership = db
    .select()
    .from(bondMembers)
    .where(and(eq(bondMembers.bondId, bondId), eq(bondMembers.userId, req.userId!)))
    .get();

  if (!membership) {
    res.status(403).json({ error: 'Not a member of this bond' });
    return;
  }
  req.bondId = bondId;
  next();
}
