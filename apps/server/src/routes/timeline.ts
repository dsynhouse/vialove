import { Router } from 'express';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  checkIns,
  journalEntries,
  vaultEntries,
  goals,
  weeklyResponses,
  weeklyPulses,
  mindfulLogs,
} from '../db/schema.js';
import { asyncHandler } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireBondMember } from '../middleware/requireBondMember.js';
import { computeBadges, computeStreak } from '../lib/badges.js';

export const timelineRouter = Router({ mergeParams: true });
timelineRouter.use(requireAuth, requireBondMember);

timelineRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const bondId = req.bondId!;
    const userId = req.userId!;

    const myCheckIns = db.select().from(checkIns).where(and(eq(checkIns.bondId, bondId), eq(checkIns.personId, userId))).all();
    const myJournal = db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.bondId, bondId), eq(journalEntries.authorId, userId)))
      .all();
    const myVault = db
      .select()
      .from(vaultEntries)
      .where(and(eq(vaultEntries.bondId, bondId), eq(vaultEntries.personId, userId)))
      .all();
    const myMindful = db
      .select()
      .from(mindfulLogs)
      .where(and(eq(mindfulLogs.bondId, bondId), eq(mindfulLogs.personId, userId)))
      .all();
    const bondGoals = db.select().from(goals).where(eq(goals.bondId, bondId)).all();
    const goalsCompleted = bondGoals.filter((g) => g.progress >= 100 && (g.ownerId === userId || g.ownerId === null)).length;

    const bondPulses = db.select().from(weeklyPulses).where(eq(weeklyPulses.bondId, bondId)).all();
    const pulseIds = bondPulses.map((p) => p.id);
    const myResponses = pulseIds.length
      ? db
          .select()
          .from(weeklyResponses)
          .where(and(eq(weeklyResponses.personId, userId), inArray(weeklyResponses.pulseId, pulseIds)))
          .all()
      : [];

    const timeline = [
      ...myCheckIns.map((c) => ({ id: c.id, date: c.createdAt, type: 'checkin' as const, title: 'Checked in', detail: c.note || undefined })),
      ...myJournal.map((j) => ({ id: j.id, date: j.createdAt, type: 'journal' as const, title: 'Journal entry', detail: j.prompt })),
      ...myVault.map((v) => ({ id: v.id, date: v.createdAt, type: 'vault' as const, title: `Added to the vault (${v.category})` })),
      ...myResponses.map((r) => ({ id: r.id, date: r.submittedAt, type: 'pulse' as const, title: 'Submitted weekly pulse' })),
      ...myMindful.map((m) => ({ id: m.id, date: m.completedAt, type: 'mindful' as const, title: `Completed a mindful session`, sessionId: m.sessionId })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const badges = computeBadges({
      checkInDates: myCheckIns.map((c) => c.date),
      journalCount: myJournal.length,
      vaultCount: myVault.length,
      sharedVaultCount: myVault.filter((v) => v.visibility === 'shared').length,
      goalsCompleted,
      mindfulCount: myMindful.length,
      pulsesSubmitted: myResponses.length,
    });

    res.json({
      timeline,
      badges,
      streak: computeStreak(myCheckIns.map((c) => c.date)),
    });
  }),
);
