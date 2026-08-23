import { useQueryClient } from '@tanstack/react-query';
import { useBondSocket } from './socket';
import { useAuth } from '../context/AuthContext';
import { useBond } from '../context/BondContext';
import { useToast } from '../context/ToastContext';
import type { CheckIn, JournalEntry, MindfulLog, VaultEntry } from './types';

const MOOD_EMOJI: Record<number, string> = { 1: '🌧️', 2: '🌥️', 3: '⛅', 4: '🌤️', 5: '☀️' };

/** Wires this bond's realtime socket room to query cache invalidation + toasts. Mount once near the app root. */
export function useRealtimeSync() {
  const { user } = useAuth();
  const { activeBondId, otherPerson } = useBond();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key, activeBondId] });
  const isMine = (personId: string) => personId === user?.id;
  const otherName = otherPerson?.name ?? 'Your partner';

  useBondSocket(activeBondId, {
    'checkin:saved': (payload) => {
      const c = payload as CheckIn;
      invalidate('checkins');
      if (!isMine(c.personId) && c.visibility === 'shared') {
        showToast({
          title: `${otherName} checked in`,
          description: c.note || undefined,
          emoji: MOOD_EMOJI[c.mood],
        });
      }
    },
    'journal:new': (payload) => {
      const j = payload as JournalEntry;
      invalidate('journal');
      if (!isMine(j.authorId) && j.visibility === 'shared') {
        showToast({ title: `${otherName} wrote in the journal`, description: j.prompt, emoji: '📓' });
      }
    },
    'vault:new': (payload) => {
      const v = payload as VaultEntry;
      invalidate('vault');
      if (!isMine(v.personId)) {
        showToast({ title: `${otherName} shared something in the vault`, emoji: '💛' });
      }
    },
    'goal:new': () => invalidate('goals'),
    'goal:update': () => invalidate('goals'),
    'goal:cheer': () => invalidate('goals'),
    'pulse:submitted': (payload) => {
      const p = payload as { weekOf: string; personId: string };
      qc.invalidateQueries({ queryKey: ['pulse', activeBondId, p.weekOf] });
      if (!isMine(p.personId)) {
        showToast({ title: `${otherName} submitted this week's pulse`, emoji: '📝' });
      }
    },
    'event:new': (payload) => {
      invalidate('events');
      const e = payload as { title: string; createdBy: string };
      if (!isMine(e.createdBy)) {
        showToast({ title: `${otherName} added a plan`, description: e.title, emoji: '🗓️' });
      }
    },
    'event:deleted': () => invalidate('events'),
    'mindful:logged': (payload) => {
      const m = payload as MindfulLog;
      invalidate('mindful');
      if (!isMine(m.personId)) {
        showToast({ title: `${otherName} completed a mindful session`, emoji: '🌬️' });
      }
    },
    'support:signal': (payload) => {
      const s = payload as { personId: string; name?: string };
      if (!isMine(s.personId)) {
        showToast({
          title: `${s.name ?? otherName} could use extra care`,
          description: 'Sent from the Village.',
          emoji: '💛',
        });
      }
    },
  });
}
