import type { CheckIn } from './types';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function checkInStreak(checkIns: CheckIn[], personId: string): number {
  const dates = new Set(checkIns.filter((c) => c.personId === personId).map((c) => c.date));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round((date.getTime() - Date.now()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
