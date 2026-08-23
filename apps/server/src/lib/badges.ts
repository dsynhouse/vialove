export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

interface BadgeInputs {
  checkInDates: string[];
  journalCount: number;
  vaultCount: number;
  sharedVaultCount: number;
  goalsCompleted: number;
  mindfulCount: number;
  pulsesSubmitted: number;
}

export function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let current = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      prev.setDate(prev.getDate() + 1);
      current = prev.toISOString().slice(0, 10) === sorted[i] ? current + 1 : 1;
    }
    best = Math.max(best, current);
  }
  return best;
}

export function computeBadges(input: BadgeInputs): Badge[] {
  return [
    {
      id: 'first-checkin',
      label: 'First Check-In',
      description: 'Shared how you were feeling for the first time.',
      earned: input.checkInDates.length > 0,
    },
    {
      id: 'consistency',
      label: 'Consistency',
      description: 'Checked in 7 days in a row.',
      earned: bestStreak(input.checkInDates) >= 7,
    },
    {
      id: 'open-book',
      label: 'Open Book',
      description: 'Shared something from the vault.',
      earned: input.sharedVaultCount > 0,
    },
    {
      id: 'deep-diver',
      label: 'Deep Diver',
      description: 'Added 5 entries to the vault.',
      earned: input.vaultCount >= 5,
    },
    {
      id: 'wordsmith',
      label: 'Wordsmith',
      description: 'Wrote 5 journal entries.',
      earned: input.journalCount >= 5,
    },
    {
      id: 'goal-getter',
      label: 'Goal Getter',
      description: 'Completed a goal.',
      earned: input.goalsCompleted > 0,
    },
    { id: 'zen', label: 'Zen', description: 'Completed 3 mindful sessions.', earned: input.mindfulCount >= 3 },
    {
      id: 'in-tune',
      label: 'In Tune',
      description: 'Submitted 2 weekly pulses.',
      earned: input.pulsesSubmitted >= 2,
    },
  ];
}
