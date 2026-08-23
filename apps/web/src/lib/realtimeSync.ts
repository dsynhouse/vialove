import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { useBond } from '../context/BondContext';
import { useToast } from '../context/ToastContext';

const MOOD_EMOJI: Record<number, string> = { 1: '🌧️', 2: '🌥️', 3: '⛅', 4: '🌤️', 5: '☀️' };

type Row = Record<string, unknown>;

/**
 * Subscribes to this bond's Supabase Realtime channel: live query invalidation
 * + toasts on postgres_changes, and presence so each person can see when their
 * partner is online right now. Mount once near the app root.
 *
 * Realtime respects the same RLS policies as regular queries — a private row
 * belonging to the other person is never delivered here in the first place,
 * so no extra client-side visibility filtering is needed.
 */
export function useRealtimeSync() {
  const { user } = useAuth();
  const { activeBondId, otherPerson } = useBond();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (!activeBondId || !user) {
      setPartnerOnline(false);
      return;
    }

    const isMine = (personId: unknown) => personId === user.id;
    const otherName = otherPerson?.name ?? 'Your partner';
    const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key, activeBondId] });

    const channel = supabase.channel(`bond:${activeBondId}`, { config: { presence: { key: user.id } } });

    const on = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', handler: (row: Row) => void) => {
      channel.on(
        'postgres_changes' as never,
        { event, schema: 'public', table, filter: `bond_id=eq.${activeBondId}` } as never,
        ((payload: RealtimePostgresChangesPayload<Row>) => handler(payload.new as Row)) as never,
      );
    };

    on('check_ins', 'INSERT', (row) => {
      invalidate('checkins');
      if (!isMine(row.person_id) && row.visibility === 'shared') {
        showToast({ title: `${otherName} checked in`, description: (row.note as string) || undefined, emoji: MOOD_EMOJI[row.mood as number] });
      }
    });
    on('check_ins', 'UPDATE', () => invalidate('checkins'));

    on('journal_entries', 'INSERT', (row) => {
      invalidate('journal');
      if (!isMine(row.author_id)) {
        showToast({ title: `${otherName} wrote in the journal`, description: row.prompt as string, emoji: '📓' });
      }
    });

    on('vault_entries', 'INSERT', (row) => {
      invalidate('vault');
      if (!isMine(row.person_id)) showToast({ title: `${otherName} shared something in the vault`, emoji: '💛' });
    });

    on('goals', 'INSERT', () => invalidate('goals'));
    on('goals', 'UPDATE', () => invalidate('goals'));
    on('goal_cheers', 'INSERT', () => invalidate('goals'));

    on('weekly_responses', 'INSERT', (row) => {
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'pulse' || q.queryKey[0] === 'pulses' });
      if (!isMine(row.person_id)) showToast({ title: `${otherName} submitted this week's pulse`, emoji: '📝' });
    });

    on('events', 'INSERT', (row) => {
      invalidate('events');
      if (!isMine(row.created_by)) showToast({ title: `${otherName} added a plan`, description: row.title as string, emoji: '🗓️' });
    });
    on('events', 'DELETE', () => invalidate('events'));

    on('mindful_logs', 'INSERT', (row) => {
      invalidate('mindful');
      if (!isMine(row.person_id)) showToast({ title: `${otherName} completed a mindful session`, emoji: '🌬️' });
    });

    on('support_signals', 'INSERT', (row) => {
      if (!isMine(row.person_id)) showToast({ title: `${otherName} could use extra care`, description: 'Sent from the Village.', emoji: '💛' });
    });

    on('thinking_of_you_pings', 'INSERT', (row) => {
      if (!isMine(row.person_id)) showToast({ title: `${otherName} is thinking of you`, emoji: '💗' });
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setPartnerOnline(otherPerson ? Object.keys(state).includes(otherPerson.id) : false);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });

    return () => {
      supabase.removeChannel(channel);
      setPartnerOnline(false);
    };
    // Intentionally omits `qc` and `showToast` — qc is a stable singleton and
    // showToast is stable across renders; re-subscribing the channel only
    // needs to happen when the bond, user, or partner identity changes.
  }, [activeBondId, user?.id, otherPerson?.id]);

  return { partnerOnline };
}
