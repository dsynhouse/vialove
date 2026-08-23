import { supabase } from './supabase';
import { bondMeta } from './bondMeta';
import type {
  Bond,
  BondType,
  CalendarEvent,
  CheckIn,
  Goal,
  JournalEntry,
  JournalKind,
  MindfulLog,
  Person,
  SupportSignal,
  TimelineResponse,
  VaultCategory,
  VaultEntry,
  Visibility,
  WeeklyPulse,
  WeeklyResponse,
} from './types';

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

async function namesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from('profiles').select('id, name').in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((p) => [p.id, p.name as string]));
}

interface BondRow {
  id: string;
  type: string;
  label: string;
  accent: string;
  accent_soft: string;
  accent_strong: string;
  invite_code: string;
  created_at: string;
}

function toBond(row: BondRow, members: Person[]): Bond {
  return {
    id: row.id,
    type: row.type as BondType,
    label: row.label,
    theme: { accent: row.accent, accentSoft: row.accent_soft, accentStrong: row.accent_strong },
    inviteCode: row.invite_code,
    members,
    createdAt: row.created_at,
  };
}

async function membersOf(bondId: string): Promise<Person[]> {
  const { data, error } = await supabase.from('bond_members').select('user_id').eq('bond_id', bondId);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((m) => m.user_id as string);
  const names = await namesByIds(ids);
  return ids.map((id) => ({ id, name: names.get(id) ?? 'Someone' }));
}

// ---- Bonds ----
export const bondsApi = {
  list: async (): Promise<Bond[]> => {
    const bonds = unwrap(await supabase.from('bonds').select('*').order('created_at')) as BondRow[];
    if (bonds.length === 0) return [];
    const bondIds = bonds.map((b) => b.id);
    const { data: allMembers, error } = await supabase
      .from('bond_members')
      .select('bond_id, user_id')
      .in('bond_id', bondIds);
    if (error) throw new Error(error.message);
    const names = await namesByIds([...new Set((allMembers ?? []).map((m) => m.user_id as string))]);
    return bonds.map((b) =>
      toBond(
        b,
        (allMembers ?? [])
          .filter((m) => m.bond_id === b.id)
          .map((m) => ({ id: m.user_id as string, name: names.get(m.user_id as string) ?? 'Someone' })),
      ),
    );
  },
  get: async (bondId: string): Promise<Bond> => {
    const row = unwrap(await supabase.from('bonds').select('*').eq('id', bondId).single()) as BondRow;
    return toBond(row, await membersOf(bondId));
  },
  create: async (type: string, label?: string): Promise<Bond> => {
    const meta = bondMeta(type as BondType);
    const row = unwrap(
      await supabase.rpc('create_bond', {
        p_type: type,
        p_label: label || meta.label,
        p_accent: meta.theme.accent,
        p_accent_soft: meta.theme.accentSoft,
        p_accent_strong: meta.theme.accentStrong,
      }),
    ) as BondRow;
    return toBond(row, await membersOf(row.id));
  },
  join: async (inviteCode: string): Promise<Bond> => {
    const row = unwrap(
      await supabase.rpc('join_bond_by_code', { p_invite_code: inviteCode }),
    ) as BondRow;
    return toBond(row, await membersOf(row.id));
  },
};

// ---- Check-ins ----
function toCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    personId: row.person_id as string,
    date: row.date as string,
    mood: row.mood as CheckIn['mood'],
    note: row.note as string,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at as string,
  };
}

export const checkInsApi = {
  list: async (bondId: string): Promise<CheckIn[]> => {
    const rows = unwrap(
      await supabase.from('check_ins').select('*').eq('bond_id', bondId).order('created_at', { ascending: false }),
    ) as Record<string, unknown>[];
    return rows.map(toCheckIn);
  },
  save: async (
    bondId: string,
    data: { date: string; mood: number; note: string; visibility: Visibility },
  ): Promise<CheckIn> => {
    const personId = await currentUserId();
    const row = unwrap(
      await supabase
        .from('check_ins')
        .upsert(
          { bond_id: bondId, person_id: personId, date: data.date, mood: data.mood, note: data.note, visibility: data.visibility },
          { onConflict: 'bond_id,person_id,date' },
        )
        .select()
        .single(),
    ) as Record<string, unknown>;
    return toCheckIn(row);
  },
};

// ---- Journal ----
function toJournalEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    authorId: row.author_id as string,
    kind: row.kind as JournalKind,
    prompt: row.prompt as string,
    content: row.content as string,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at as string,
  };
}

export const journalApi = {
  list: async (bondId: string): Promise<JournalEntry[]> => {
    const rows = unwrap(
      await supabase.from('journal_entries').select('*').eq('bond_id', bondId).order('created_at', { ascending: false }),
    ) as Record<string, unknown>[];
    return rows.map(toJournalEntry);
  },
  create: async (
    bondId: string,
    data: { kind: JournalKind; prompt: string; content: string; visibility: Visibility },
  ): Promise<JournalEntry> => {
    const authorId = await currentUserId();
    const row = unwrap(
      await supabase
        .from('journal_entries')
        .insert({ bond_id: bondId, author_id: authorId, ...data })
        .select()
        .single(),
    ) as Record<string, unknown>;
    return toJournalEntry(row);
  },
};

// ---- Vault ----
function toVaultEntry(row: Record<string, unknown>): VaultEntry {
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    personId: row.person_id as string,
    category: row.category as VaultCategory,
    content: row.content as string,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at as string,
  };
}

export const vaultApi = {
  list: async (bondId: string): Promise<VaultEntry[]> => {
    const rows = unwrap(
      await supabase.from('vault_entries').select('*').eq('bond_id', bondId).order('created_at', { ascending: false }),
    ) as Record<string, unknown>[];
    return rows.map(toVaultEntry);
  },
  create: async (
    bondId: string,
    data: { category: VaultCategory; content: string; visibility: Visibility },
  ): Promise<VaultEntry> => {
    const personId = await currentUserId();
    const row = unwrap(
      await supabase
        .from('vault_entries')
        .insert({ bond_id: bondId, person_id: personId, ...data })
        .select()
        .single(),
    ) as Record<string, unknown>;
    return toVaultEntry(row);
  },
};

// ---- Goals ----
async function toGoal(row: Record<string, unknown>): Promise<Goal> {
  const { data: cheers, error } = await supabase.from('goal_cheers').select('person_id').eq('goal_id', row.id);
  if (error) throw new Error(error.message);
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    ownerId: (row.owner_id as string | null) ?? 'shared',
    title: row.title as string,
    progress: row.progress as number,
    cheers: (cheers ?? []).map((c) => c.person_id as string),
    createdAt: row.created_at as string,
  };
}

export const goalsApi = {
  list: async (bondId: string): Promise<Goal[]> => {
    const rows = unwrap(
      await supabase.from('goals').select('*').eq('bond_id', bondId).order('created_at', { ascending: false }),
    ) as Record<string, unknown>[];
    return Promise.all(rows.map(toGoal));
  },
  create: async (bondId: string, data: { title: string; ownerId: string | 'shared' }): Promise<Goal> => {
    const row = unwrap(
      await supabase
        .from('goals')
        .insert({ bond_id: bondId, title: data.title, owner_id: data.ownerId === 'shared' ? null : data.ownerId })
        .select()
        .single(),
    ) as Record<string, unknown>;
    return toGoal(row);
  },
  updateProgress: async (_bondId: string, goalId: string, progress: number): Promise<Goal> => {
    const row = unwrap(
      await supabase.from('goals').update({ progress }).eq('id', goalId).select().single(),
    ) as Record<string, unknown>;
    return toGoal(row);
  },
  cheer: async (_bondId: string, goalId: string): Promise<Goal> => {
    const personId = await currentUserId();
    await supabase.from('goal_cheers').upsert({ goal_id: goalId, person_id: personId }, { onConflict: 'goal_id,person_id' });
    const row = unwrap(await supabase.from('goals').select('*').eq('id', goalId).single()) as Record<string, unknown>;
    return toGoal(row);
  },
};

// ---- Weekly pulses ----
function toResponse(row: Record<string, unknown>): WeeklyResponse {
  return {
    appreciation: row.appreciation as string,
    friction: row.friction as string,
    request: row.request as string,
    win: row.win as string,
    tryThis: row.try_this as string,
    submittedAt: row.submitted_at as string,
  };
}

export const weeklyPulsesApi = {
  getWeek: async (bondId: string, weekOf: string): Promise<WeeklyPulse> => {
    const { data: pulse, error } = await supabase
      .from('weekly_pulses')
      .select('id')
      .eq('bond_id', bondId)
      .eq('week_of', weekOf)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pulse) return { weekOf, responses: {} };

    const { data: rows, error: rErr } = await supabase.from('weekly_responses').select('*').eq('pulse_id', pulse.id);
    if (rErr) throw new Error(rErr.message);
    const responses: Record<string, WeeklyResponse> = {};
    for (const row of rows ?? []) responses[row.person_id as string] = toResponse(row as Record<string, unknown>);
    return { weekOf, responses };
  },
  listPast: async (bondId: string, currentWeekOf: string): Promise<WeeklyPulse[]> => {
    const { data: pulses, error } = await supabase
      .from('weekly_pulses')
      .select('id, week_of')
      .eq('bond_id', bondId)
      .neq('week_of', currentWeekOf);
    if (error) throw new Error(error.message);
    if (!pulses || pulses.length === 0) return [];

    const pulseIds = pulses.map((p) => p.id);
    const { data: rows, error: rErr } = await supabase.from('weekly_responses').select('*').in('pulse_id', pulseIds);
    if (rErr) throw new Error(rErr.message);

    return pulses.map((p) => {
      const responses: Record<string, WeeklyResponse> = {};
      for (const row of rows ?? []) {
        if (row.pulse_id === p.id) responses[row.person_id as string] = toResponse(row as Record<string, unknown>);
      }
      return { weekOf: p.week_of as string, responses };
    });
  },
  submit: async (bondId: string, weekOf: string, response: Omit<WeeklyResponse, 'submittedAt'>): Promise<{ ok: true }> => {
    const { error } = await supabase.rpc('submit_weekly_response', {
      p_bond_id: bondId,
      p_week_of: weekOf,
      p_appreciation: response.appreciation,
      p_friction: response.friction,
      p_request: response.request,
      p_win: response.win,
      p_try_this: response.tryThis,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  },
};

// ---- Events ----
function toEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    createdBy: row.created_by as string,
    title: row.title as string,
    date: row.date as string,
    time: row.time as string,
    type: row.type as CalendarEvent['type'],
    notes: (row.notes as string | null) ?? undefined,
  };
}

export const eventsApi = {
  list: async (bondId: string): Promise<CalendarEvent[]> => {
    const rows = unwrap(await supabase.from('events').select('*').eq('bond_id', bondId)) as Record<string, unknown>[];
    return rows.map(toEvent);
  },
  create: async (bondId: string, data: Omit<CalendarEvent, 'id' | 'bondId' | 'createdBy'>): Promise<CalendarEvent> => {
    const createdBy = await currentUserId();
    const row = unwrap(
      await supabase
        .from('events')
        .insert({ bond_id: bondId, created_by: createdBy, ...data })
        .select()
        .single(),
    ) as Record<string, unknown>;
    return toEvent(row);
  },
  remove: async (_bondId: string, eventId: string): Promise<void> => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw new Error(error.message);
  },
};

// ---- Mindful ----
function toMindfulLog(row: Record<string, unknown>): MindfulLog {
  return {
    id: row.id as string,
    bondId: row.bond_id as string,
    personId: row.person_id as string,
    sessionId: row.session_id as string,
    completedAt: row.completed_at as string,
  };
}

export const mindfulApi = {
  list: async (bondId: string): Promise<MindfulLog[]> => {
    const rows = unwrap(await supabase.from('mindful_logs').select('*').eq('bond_id', bondId)) as Record<string, unknown>[];
    return rows.map(toMindfulLog);
  },
  log: async (bondId: string, sessionId: string): Promise<MindfulLog> => {
    const personId = await currentUserId();
    const row = unwrap(
      await supabase.from('mindful_logs').insert({ bond_id: bondId, person_id: personId, session_id: sessionId }).select().single(),
    ) as Record<string, unknown>;
    return toMindfulLog(row);
  },
};

// ---- Support signals ----
export const supportApi = {
  list: async (bondId: string): Promise<SupportSignal[]> => {
    const rows = unwrap(
      await supabase.from('support_signals').select('*').eq('bond_id', bondId).order('created_at', { ascending: false }).limit(20),
    ) as Record<string, unknown>[];
    return rows.map((r) => ({ id: r.id as string, personId: r.person_id as string, createdAt: r.created_at as string }));
  },
  send: async (bondId: string): Promise<SupportSignal> => {
    const personId = await currentUserId();
    const row = unwrap(
      await supabase.from('support_signals').insert({ bond_id: bondId, person_id: personId }).select().single(),
    ) as Record<string, unknown>;
    return { id: row.id as string, personId: row.person_id as string, createdAt: row.created_at as string };
  },
};

// ---- Thinking of you pings ----
export const pingsApi = {
  send: async (bondId: string): Promise<void> => {
    const personId = await currentUserId();
    const { error } = await supabase.from('thinking_of_you_pings').insert({ bond_id: bondId, person_id: personId });
    if (error) throw new Error(error.message);
  },
};

// ---- Timeline / badges ----
export const timelineApi = {
  get: async (bondId: string): Promise<TimelineResponse> =>
    unwrap(await supabase.rpc('get_profile_stats', { p_bond_id: bondId })) as unknown as TimelineResponse,
};
