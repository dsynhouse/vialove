export type BondType = 'couple' | 'parent-child' | 'friends' | 'siblings' | 'custom';

export interface BondTheme {
  accent: string;
  accentSoft: string;
  accentStrong: string;
}

export interface Person {
  id: string;
  name: string;
}

export interface Bond {
  id: string;
  type: BondType;
  label: string;
  people: [Person, Person];
  createdAt: string;
  theme: BondTheme;
}

export type Visibility = 'private' | 'shared';

export interface CheckIn {
  id: string;
  bondId: string;
  personId: string;
  date: string; // yyyy-mm-dd
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  visibility: Visibility;
  createdAt: string;
}

export type JournalKind = 'reflective' | 'fun';

export interface JournalEntry {
  id: string;
  bondId: string;
  authorId: string;
  kind: JournalKind;
  prompt: string;
  content: string;
  visibility: Visibility;
  createdAt: string;
}

export type VaultCategory =
  | 'dream'
  | 'aspiration'
  | 'fear'
  | 'worry'
  | 'regret'
  | 'shame'
  | 'goal';

export interface VaultEntry {
  id: string;
  bondId: string;
  personId: string;
  category: VaultCategory;
  content: string;
  visibility: Visibility;
  createdAt: string;
}

export interface Goal {
  id: string;
  bondId: string;
  ownerId: string | 'shared';
  title: string;
  progress: number; // 0-100
  cheers: string[]; // personIds who cheered
  createdAt: string;
}

export interface WeeklyResponse {
  appreciation: string;
  friction: string;
  request: string;
  win: string;
  tryThis: string;
  submittedAt: string;
}

export interface WeeklyPulse {
  id: string;
  bondId: string;
  weekOf: string; // yyyy-mm-dd (Monday)
  responses: Record<string, WeeklyResponse>; // personId -> response
}

export type EventType = 'meet-discuss' | 'date' | 'ritual';

export interface CalendarEvent {
  id: string;
  bondId: string;
  title: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  type: EventType;
  notes?: string;
}

export interface EmpathyGuess {
  id: string;
  bondId: string;
  guesserId: string;
  date: string;
  guessedMood: 1 | 2 | 3 | 4 | 5;
}

export interface MindfulSession {
  id: string;
  title: string;
  minutes: number;
  kind: 'breathing' | 'meditation' | 'spiritual';
  description: string;
}

export interface MindfulLog {
  id: string;
  bondId: string;
  personId: string;
  sessionId: string;
  completedAt: string;
}
