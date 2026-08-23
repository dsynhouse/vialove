import type {
  Bond,
  CalendarEvent,
  CheckIn,
  Goal,
  JournalEntry,
  JournalKind,
  MindfulLog,
  SupportSignal,
  TimelineResponse,
  User,
  VaultCategory,
  VaultEntry,
  Visibility,
  WeeklyPulse,
  WeeklyResponse,
} from './types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // no body
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ---- Auth ----
export const authApi = {
  signup: (email: string, password: string, name: string) =>
    post<User>('/api/auth/signup', { email, password, name }),
  login: (email: string, password: string) => post<User>('/api/auth/login', { email, password }),
  logout: () => post<void>('/api/auth/logout'),
  me: () => request<User>('/api/auth/me'),
};

// ---- Bonds ----
export const bondsApi = {
  list: () => request<Bond[]>('/api/bonds'),
  get: (bondId: string) => request<Bond>(`/api/bonds/${bondId}`),
  create: (type: string, label?: string) => post<Bond>('/api/bonds', { type, label }),
  join: (inviteCode: string) => post<Bond>('/api/bonds/join', { inviteCode }),
};

// ---- Check-ins ----
export const checkInsApi = {
  list: (bondId: string) => request<CheckIn[]>(`/api/bonds/${bondId}/check-ins`),
  save: (bondId: string, data: { date: string; mood: number; note: string; visibility: Visibility }) =>
    post<CheckIn>(`/api/bonds/${bondId}/check-ins`, data),
};

// ---- Journal ----
export const journalApi = {
  list: (bondId: string) => request<JournalEntry[]>(`/api/bonds/${bondId}/journal`),
  create: (
    bondId: string,
    data: { kind: JournalKind; prompt: string; content: string; visibility: Visibility },
  ) => post<JournalEntry>(`/api/bonds/${bondId}/journal`, data),
};

// ---- Vault ----
export const vaultApi = {
  list: (bondId: string) => request<VaultEntry[]>(`/api/bonds/${bondId}/vault`),
  create: (bondId: string, data: { category: VaultCategory; content: string; visibility: Visibility }) =>
    post<VaultEntry>(`/api/bonds/${bondId}/vault`, data),
};

// ---- Goals ----
export const goalsApi = {
  list: (bondId: string) => request<Goal[]>(`/api/bonds/${bondId}/goals`),
  create: (bondId: string, data: { title: string; ownerId: string | 'shared' }) =>
    post<Goal>(`/api/bonds/${bondId}/goals`, data),
  updateProgress: (bondId: string, goalId: string, progress: number) =>
    patch<Goal>(`/api/bonds/${bondId}/goals/${goalId}`, { progress }),
  cheer: (bondId: string, goalId: string) => post<Goal>(`/api/bonds/${bondId}/goals/${goalId}/cheer`),
};

// ---- Weekly pulses ----
export const weeklyPulsesApi = {
  getWeek: (bondId: string, weekOf: string) =>
    request<WeeklyPulse>(`/api/bonds/${bondId}/weekly-pulses/${weekOf}`),
  listPast: (bondId: string, currentWeekOf: string) =>
    request<WeeklyPulse[]>(
      `/api/bonds/${bondId}/weekly-pulses?currentWeekOf=${encodeURIComponent(currentWeekOf)}`,
    ),
  submit: (bondId: string, weekOf: string, response: Omit<WeeklyResponse, 'submittedAt'>) =>
    post<{ ok: true }>(`/api/bonds/${bondId}/weekly-pulses/${weekOf}/responses`, response),
};

// ---- Events ----
export const eventsApi = {
  list: (bondId: string) => request<CalendarEvent[]>(`/api/bonds/${bondId}/events`),
  create: (bondId: string, data: Omit<CalendarEvent, 'id' | 'bondId' | 'createdBy'>) =>
    post<CalendarEvent>(`/api/bonds/${bondId}/events`, data),
  remove: (bondId: string, eventId: string) => del<void>(`/api/bonds/${bondId}/events/${eventId}`),
};

// ---- Mindful ----
export const mindfulApi = {
  list: (bondId: string) => request<MindfulLog[]>(`/api/bonds/${bondId}/mindful-logs`),
  log: (bondId: string, sessionId: string) =>
    post<MindfulLog>(`/api/bonds/${bondId}/mindful-logs`, { sessionId }),
};

// ---- Support signals ----
export const supportApi = {
  list: (bondId: string) => request<SupportSignal[]>(`/api/bonds/${bondId}/support-signals`),
  send: (bondId: string) => post<SupportSignal>(`/api/bonds/${bondId}/support-signals`),
};

// ---- Timeline / badges ----
export const timelineApi = {
  get: (bondId: string) => request<TimelineResponse>(`/api/bonds/${bondId}/timeline`),
};
