import type { StoreShape } from './storage';

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export function computeBadges(store: StoreShape, bondId: string, personId: string): Badge[] {
  const checkIns = store.checkIns.filter((c) => c.bondId === bondId && c.personId === personId);
  const journal = store.journalEntries.filter((j) => j.bondId === bondId && j.authorId === personId);
  const vault = store.vaultEntries.filter((v) => v.bondId === bondId && v.personId === personId);
  const sharedVault = vault.filter((v) => v.visibility === 'shared');
  const goalsHit = store.goals.filter(
    (g) => g.bondId === bondId && (g.ownerId === personId || g.ownerId === 'shared') && g.progress >= 100,
  );
  const mindful = store.mindfulLogs.filter((l) => l.bondId === bondId && l.personId === personId);
  const pulses = store.weeklyPulses.filter((w) => w.bondId === bondId && w.responses[personId]);

  let bestStreak = 0;
  let current = 0;
  const dates = [...new Set(checkIns.map((c) => c.date))].sort();
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(dates[i - 1]);
      prev.setDate(prev.getDate() + 1);
      current = prev.toISOString().slice(0, 10) === dates[i] ? current + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, current);
  }

  return [
    { id: 'first-checkin', label: 'First Check-In', description: 'Shared how you were feeling for the first time.', earned: checkIns.length > 0 },
    { id: 'consistency', label: 'Consistency', description: 'Checked in 7 days in a row.', earned: bestStreak >= 7 },
    { id: 'open-book', label: 'Open Book', description: 'Shared something from the vault.', earned: sharedVault.length > 0 },
    { id: 'deep-diver', label: 'Deep Diver', description: 'Added 5 entries to the vault.', earned: vault.length >= 5 },
    { id: 'wordsmith', label: 'Wordsmith', description: 'Wrote 5 journal entries.', earned: journal.length >= 5 },
    { id: 'goal-getter', label: 'Goal Getter', description: 'Completed a goal.', earned: goalsHit.length > 0 },
    { id: 'zen', label: 'Zen', description: 'Completed 3 mindful sessions.', earned: mindful.length >= 3 },
    { id: 'in-tune', label: 'In Tune', description: 'Submitted 2 weekly pulses.', earned: pulses.length >= 2 },
  ];
}
