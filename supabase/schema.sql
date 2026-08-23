-- vialove — Supabase schema, RLS policies, and RPC functions.
-- Paste this whole file into the Supabase SQL Editor and run it once on a
-- fresh project. Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE
-- throughout) except for the table CREATE statements themselves.

create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES — public-facing user data (name), 1:1 with auth.users
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A new auth.users row (signup) automatically gets a profile, pulling the
-- name from the signup call's options.data.name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- BONDS + MEMBERSHIP
-- ============================================================================

create table if not exists public.bonds (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  label text not null,
  accent text not null,
  accent_soft text not null,
  accent_strong text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.bond_members (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (bond_id, user_id)
);

alter table public.bonds enable row level security;
alter table public.bond_members enable row level security;

-- Shared helper: is the current user a member of this bond?
create or replace function public.is_bond_member(target_bond_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.bond_members
    where bond_id = target_bond_id and user_id = auth.uid()
  );
$$;

-- Profiles: visible to yourself, and to anyone who shares a bond with you.
create policy "profiles: self or bondmate select" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.bond_members mine
      join public.bond_members theirs on theirs.bond_id = mine.bond_id
      where mine.user_id = auth.uid() and theirs.user_id = public.profiles.id
    )
  );
create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid());

create policy "bonds: member select" on public.bonds
  for select using (public.is_bond_member(id));
create policy "bond_members: member select" on public.bond_members
  for select using (public.is_bond_member(bond_id));

-- No direct INSERT policies on bonds/bond_members — creating and joining a
-- bond both go through the SECURITY DEFINER functions below, so capacity
-- (max 2 people) and invite-code matching are enforced in one place.

create or replace function public.create_bond(p_type text, p_label text, p_accent text, p_accent_soft text, p_accent_strong text)
returns public.bonds
language plpgsql
security definer set search_path = public
as $$
declare
  new_bond public.bonds;
  code text;
begin
  code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  insert into public.bonds (type, label, accent, accent_soft, accent_strong, invite_code, created_by)
  values (p_type, p_label, p_accent, p_accent_soft, p_accent_strong, code, auth.uid())
  returning * into new_bond;

  insert into public.bond_members (bond_id, user_id) values (new_bond.id, auth.uid());
  return new_bond;
end;
$$;

create or replace function public.join_bond_by_code(p_invite_code text)
returns public.bonds
language plpgsql
security definer set search_path = public
as $$
declare
  target public.bonds;
  member_count int;
begin
  select * into target from public.bonds where invite_code = upper(p_invite_code);
  if target.id is null then
    raise exception 'No bond found for that invite code';
  end if;

  if exists (select 1 from public.bond_members where bond_id = target.id and user_id = auth.uid()) then
    return target; -- already a member, idempotent
  end if;

  select count(*) into member_count from public.bond_members where bond_id = target.id;
  if member_count >= 2 then
    raise exception 'This bond already has two people in it';
  end if;

  insert into public.bond_members (bond_id, user_id) values (target.id, auth.uid());
  return target;
end;
$$;

-- ============================================================================
-- CHECK-INS, JOURNAL, VAULT — shared shape: bond-scoped, visibility-gated
-- ============================================================================

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood smallint not null check (mood between 1 and 5),
  note text not null default '',
  visibility text not null default 'shared' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  unique (bond_id, person_id, date)
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('reflective', 'fun')),
  prompt text not null,
  content text not null,
  visibility text not null default 'shared' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now()
);

create table if not exists public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('dream', 'aspiration', 'fear', 'worry', 'regret', 'shame', 'goal')),
  content text not null,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now()
);

alter table public.check_ins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.vault_entries enable row level security;

create policy "check_ins: member+visibility select" on public.check_ins
  for select using (public.is_bond_member(bond_id) and (visibility = 'shared' or person_id = auth.uid()));
create policy "check_ins: self insert" on public.check_ins
  for insert with check (public.is_bond_member(bond_id) and person_id = auth.uid());
create policy "check_ins: self update" on public.check_ins
  for update using (public.is_bond_member(bond_id) and person_id = auth.uid());

create policy "journal_entries: member+visibility select" on public.journal_entries
  for select using (public.is_bond_member(bond_id) and (visibility = 'shared' or author_id = auth.uid()));
create policy "journal_entries: self insert" on public.journal_entries
  for insert with check (public.is_bond_member(bond_id) and author_id = auth.uid());

create policy "vault_entries: member+visibility select" on public.vault_entries
  for select using (public.is_bond_member(bond_id) and (visibility = 'shared' or person_id = auth.uid()));
create policy "vault_entries: self insert" on public.vault_entries
  for insert with check (public.is_bond_member(bond_id) and person_id = auth.uid());

-- ============================================================================
-- GOALS + CHEERS
-- ============================================================================

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  owner_id uuid references auth.users (id), -- null = shared goal
  title text not null,
  progress smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.goal_cheers (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (goal_id, person_id)
);

alter table public.goals enable row level security;
alter table public.goal_cheers enable row level security;

create policy "goals: member select" on public.goals
  for select using (public.is_bond_member(bond_id));
create policy "goals: member insert" on public.goals
  for insert with check (public.is_bond_member(bond_id));
create policy "goals: member update" on public.goals
  for update using (public.is_bond_member(bond_id));

create policy "goal_cheers: member select" on public.goal_cheers
  for select using (exists (select 1 from public.goals g where g.id = goal_id and public.is_bond_member(g.bond_id)));
create policy "goal_cheers: self insert" on public.goal_cheers
  for insert with check (
    person_id = auth.uid()
    and exists (select 1 from public.goals g where g.id = goal_id and public.is_bond_member(g.bond_id))
  );

-- ============================================================================
-- WEEKLY PULSE — blind until both partners submit for the current week
-- ============================================================================

create table if not exists public.weekly_pulses (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  week_of date not null,
  created_at timestamptz not null default now(),
  unique (bond_id, week_of)
);

create table if not exists public.weekly_responses (
  id uuid primary key default gen_random_uuid(),
  pulse_id uuid not null references public.weekly_pulses (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  appreciation text not null default '',
  friction text not null default '',
  request text not null default '',
  win text not null default '',
  try_this text not null default '',
  submitted_at timestamptz not null default now(),
  unique (pulse_id, person_id)
);

alter table public.weekly_pulses enable row level security;
alter table public.weekly_responses enable row level security;

create policy "weekly_pulses: member select" on public.weekly_pulses
  for select using (public.is_bond_member(bond_id));

-- Self-referencing checks in an RLS policy on the same table cause "infinite
-- recursion detected in policy" — Postgres would have to re-apply this very
-- policy to filter the subquery. A SECURITY DEFINER function sidesteps that
-- by reading with elevated privileges instead of the caller's RLS context.
create or replace function public.has_submitted_weekly_response(p_pulse_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.weekly_responses
    where pulse_id = p_pulse_id and person_id = auth.uid()
  );
$$;

-- Blind-reveal rule: you always see your own response; you see your
-- partner's response for a past week unconditionally, or for the *current*
-- week only once you've submitted your own for that same pulse.
create policy "weekly_responses: blind-until-both-submit select" on public.weekly_responses
  for select using (
    exists (select 1 from public.weekly_pulses wp where wp.id = pulse_id and public.is_bond_member(wp.bond_id))
    and (
      person_id = auth.uid()
      or exists (
        select 1 from public.weekly_pulses wp
        where wp.id = pulse_id and wp.week_of <> date_trunc('week', now())::date
      )
      or public.has_submitted_weekly_response(pulse_id)
    )
  );

-- Submitting a response finds-or-creates the week's pulse row and
-- upserts the caller's response, atomically.
create or replace function public.submit_weekly_response(
  p_bond_id uuid, p_week_of date, p_appreciation text, p_friction text,
  p_request text, p_win text, p_try_this text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_pulse_id uuid;
begin
  if not public.is_bond_member(p_bond_id) then
    raise exception 'Not a member of this bond';
  end if;

  insert into public.weekly_pulses (bond_id, week_of) values (p_bond_id, p_week_of)
  on conflict (bond_id, week_of) do update set bond_id = excluded.bond_id
  returning id into v_pulse_id;

  insert into public.weekly_responses (pulse_id, person_id, appreciation, friction, request, win, try_this)
  values (v_pulse_id, auth.uid(), p_appreciation, p_friction, p_request, p_win, p_try_this)
  on conflict (pulse_id, person_id) do update set
    appreciation = excluded.appreciation, friction = excluded.friction, request = excluded.request,
    win = excluded.win, try_this = excluded.try_this, submitted_at = now();
end;
$$;

-- ============================================================================
-- EVENTS, MINDFUL LOGS, SUPPORT SIGNALS
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  title text not null,
  date date not null,
  time text not null,
  type text not null check (type in ('meet-discuss', 'date', 'ritual')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mindful_logs (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.support_signals (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- "Thinking of you" — a lighter-weight cousin of support_signals: a single-tap,
-- zero-typing nudge either partner can send any time, just to say I'm thinking of you.
create table if not exists public.thinking_of_you_pings (
  id uuid primary key default gen_random_uuid(),
  bond_id uuid not null references public.bonds (id) on delete cascade,
  person_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.mindful_logs enable row level security;
alter table public.support_signals enable row level security;
alter table public.thinking_of_you_pings enable row level security;

create policy "events: member select" on public.events for select using (public.is_bond_member(bond_id));
create policy "events: self insert" on public.events for insert with check (public.is_bond_member(bond_id) and created_by = auth.uid());
create policy "events: member delete" on public.events for delete using (public.is_bond_member(bond_id));

create policy "mindful_logs: member select" on public.mindful_logs for select using (public.is_bond_member(bond_id));
create policy "mindful_logs: self insert" on public.mindful_logs for insert with check (public.is_bond_member(bond_id) and person_id = auth.uid());

create policy "support_signals: member select" on public.support_signals for select using (public.is_bond_member(bond_id));
create policy "support_signals: self insert" on public.support_signals for insert with check (public.is_bond_member(bond_id) and person_id = auth.uid());

create policy "pings: member select" on public.thinking_of_you_pings for select using (public.is_bond_member(bond_id));
create policy "pings: self insert" on public.thinking_of_you_pings for insert with check (public.is_bond_member(bond_id) and person_id = auth.uid());

-- ============================================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: self select" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push_subscriptions: self insert" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_subscriptions: self delete" on public.push_subscriptions for delete using (user_id = auth.uid());

-- ============================================================================
-- PROFILE TIMELINE + BADGES — one aggregated RPC mirroring the old REST route
-- ============================================================================

create or replace function public.get_profile_stats(p_bond_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  uid uuid := auth.uid();
  checkin_dates date[];
  journal_count int;
  vault_count int;
  shared_vault_count int;
  goals_completed int;
  mindful_count int;
  pulses_submitted int;
  streak int := 0;
  best_streak int := 0;
  cur int := 0;
  d date;
  timeline jsonb;
begin
  if not public.is_bond_member(p_bond_id) then
    raise exception 'Not a member of this bond';
  end if;

  select array_agg(distinct date order by date) into checkin_dates
    from public.check_ins where bond_id = p_bond_id and person_id = uid;
  select count(*) into journal_count from public.journal_entries where bond_id = p_bond_id and author_id = uid;
  select count(*) into vault_count from public.vault_entries where bond_id = p_bond_id and person_id = uid;
  select count(*) into shared_vault_count from public.vault_entries where bond_id = p_bond_id and person_id = uid and visibility = 'shared';
  select count(*) into goals_completed from public.goals where bond_id = p_bond_id and progress >= 100 and (owner_id = uid or owner_id is null);
  select count(*) into mindful_count from public.mindful_logs where bond_id = p_bond_id and person_id = uid;
  select count(*) into pulses_submitted from public.weekly_responses wr
    join public.weekly_pulses wp on wp.id = wr.pulse_id where wp.bond_id = p_bond_id and wr.person_id = uid;

  -- current streak (consecutive days ending today)
  d := current_date;
  while checkin_dates is not null and d = any(checkin_dates) loop
    streak := streak + 1;
    d := d - 1;
  end loop;

  -- best-ever streak (for the "Consistency" badge)
  if checkin_dates is not null then
    for i in 1 .. array_length(checkin_dates, 1) loop
      if i = 1 or checkin_dates[i] = checkin_dates[i - 1] + 1 then
        cur := cur + 1;
      else
        cur := 1;
      end if;
      best_streak := greatest(best_streak, cur);
    end loop;
  end if;

  select coalesce(jsonb_agg(item order by item ->> 'date' desc), '[]'::jsonb) into timeline
  from (
    select jsonb_build_object('id', id, 'date', created_at, 'type', 'checkin', 'title', 'Checked in', 'detail', nullif(note, '')) as item
      from public.check_ins where bond_id = p_bond_id and person_id = uid
    union all
    select jsonb_build_object('id', id, 'date', created_at, 'type', 'journal', 'title', 'Journal entry', 'detail', prompt)
      from public.journal_entries where bond_id = p_bond_id and author_id = uid
    union all
    select jsonb_build_object('id', id, 'date', created_at, 'type', 'vault', 'title', 'Added to the vault (' || category || ')', 'detail', null)
      from public.vault_entries where bond_id = p_bond_id and person_id = uid
    union all
    select jsonb_build_object('id', wr.id, 'date', wr.submitted_at, 'type', 'pulse', 'title', 'Submitted weekly pulse', 'detail', null)
      from public.weekly_responses wr join public.weekly_pulses wp on wp.id = wr.pulse_id
      where wp.bond_id = p_bond_id and wr.person_id = uid
    union all
    select jsonb_build_object('id', id, 'date', completed_at, 'type', 'mindful', 'title', 'Completed a mindful session', 'detail', session_id)
      from public.mindful_logs where bond_id = p_bond_id and person_id = uid
  ) t;

  return jsonb_build_object(
    'streak', streak,
    'timeline', timeline,
    'badges', jsonb_build_array(
      jsonb_build_object('id', 'first-checkin', 'label', 'First Check-In', 'description', 'Shared how you were feeling for the first time.', 'earned', coalesce(array_length(checkin_dates, 1), 0) > 0),
      jsonb_build_object('id', 'consistency', 'label', 'Consistency', 'description', 'Checked in 7 days in a row.', 'earned', best_streak >= 7),
      jsonb_build_object('id', 'open-book', 'label', 'Open Book', 'description', 'Shared something from the vault.', 'earned', shared_vault_count > 0),
      jsonb_build_object('id', 'deep-diver', 'label', 'Deep Diver', 'description', 'Added 5 entries to the vault.', 'earned', vault_count >= 5),
      jsonb_build_object('id', 'wordsmith', 'label', 'Wordsmith', 'description', 'Wrote 5 journal entries.', 'earned', journal_count >= 5),
      jsonb_build_object('id', 'goal-getter', 'label', 'Goal Getter', 'description', 'Completed a goal.', 'earned', goals_completed > 0),
      jsonb_build_object('id', 'zen', 'label', 'Zen', 'description', 'Completed 3 mindful sessions.', 'earned', mindful_count >= 3),
      jsonb_build_object('id', 'in-tune', 'label', 'In Tune', 'description', 'Submitted 2 weekly pulses.', 'earned', pulses_submitted >= 2)
    )
  );
end;
$$;

-- ============================================================================
-- INDEXES — bond_id is the hot lookup path for nearly every query
-- ============================================================================

create index if not exists idx_check_ins_bond on public.check_ins (bond_id);
create index if not exists idx_journal_entries_bond on public.journal_entries (bond_id);
create index if not exists idx_vault_entries_bond on public.vault_entries (bond_id);
create index if not exists idx_goals_bond on public.goals (bond_id);
create index if not exists idx_weekly_pulses_bond on public.weekly_pulses (bond_id);
create index if not exists idx_events_bond on public.events (bond_id);
create index if not exists idx_mindful_logs_bond on public.mindful_logs (bond_id);
create index if not exists idx_support_signals_bond on public.support_signals (bond_id);
create index if not exists idx_pings_bond on public.thinking_of_you_pings (bond_id);
create index if not exists idx_bond_members_user on public.bond_members (user_id);

-- ============================================================================
-- REALTIME — broadcast changes on bond-scoped tables to subscribed clients
-- ============================================================================

alter publication supabase_realtime add table
  public.check_ins, public.journal_entries, public.vault_entries, public.goals,
  public.goal_cheers, public.weekly_responses, public.events, public.mindful_logs,
  public.support_signals, public.thinking_of_you_pings;
