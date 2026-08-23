const KEY = 'vialove:v1';

export interface StoreShape {
  bonds: import('./types').Bond[];
  activeBondId: string | null;
  activePersonId: string | null;
  checkIns: import('./types').CheckIn[];
  journalEntries: import('./types').JournalEntry[];
  vaultEntries: import('./types').VaultEntry[];
  goals: import('./types').Goal[];
  weeklyPulses: import('./types').WeeklyPulse[];
  events: import('./types').CalendarEvent[];
  empathyGuesses: import('./types').EmpathyGuess[];
  mindfulLogs: import('./types').MindfulLog[];
}

export function emptyStore(): StoreShape {
  return {
    bonds: [],
    activeBondId: null,
    activePersonId: null,
    checkIns: [],
    journalEntries: [],
    vaultEntries: [],
    goals: [],
    weeklyPulses: [],
    events: [],
    empathyGuesses: [],
    mindfulLogs: [],
  };
}

export function loadStore(): StoreShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: StoreShape) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors — non-critical for a demo persistence layer
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
