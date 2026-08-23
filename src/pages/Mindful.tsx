import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Wind, Sparkle, Feather } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Pill, EmptyState } from '../components/ui';
import { MINDFUL_SESSIONS } from '../lib/content';
import { BreathingOrb } from '../components/MoodRing';
import type { MindfulSession } from '../lib/types';

const KIND_ICON: Record<MindfulSession['kind'], typeof Wind> = {
  breathing: Wind,
  meditation: Sparkle,
  spiritual: Feather,
};

export default function Mindful() {
  const { activeBond, activePerson, store, logMindfulSession } = useApp();
  const [filter, setFilter] = useState<MindfulSession['kind'] | 'all'>('all');
  const [session, setSession] = useState<MindfulSession | null>(null);

  if (!activeBond || !activePerson) return null;

  const sessions = MINDFUL_SESSIONS.filter((s) => filter === 'all' || s.kind === filter);
  const completedToday = store.mindfulLogs.filter(
    (l) => l.bondId === activeBond.id && l.completedAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeading
        eyebrow="Mindful space"
        title="Breathe, reflect, reconnect"
        description="Short guided practices to steady yourselves individually, or side by side."
      />

      {session ? (
        <SessionPlayer
          session={session}
          onClose={() => setSession(null)}
          onComplete={() => {
            logMindfulSession(activePerson.id, session.id);
            setSession(null);
          }}
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <Pill active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Pill>
            <Pill active={filter === 'breathing'} onClick={() => setFilter('breathing')}>
              Breathing
            </Pill>
            <Pill active={filter === 'meditation'} onClick={() => setFilter('meditation')}>
              Meditation
            </Pill>
            <Pill active={filter === 'spiritual'} onClick={() => setFilter('spiritual')}>
              Spiritual
            </Pill>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {sessions.map((s) => {
              const Icon = KIND_ICON[s.kind];
              return (
                <button key={s.id} onClick={() => setSession(s)} className="text-left">
                  <Card className="p-5 h-full hover:shadow-[var(--shadow-lift)] transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bond-bg-soft bond-accent flex items-center justify-center">
                        <Icon size={16} />
                      </span>
                      <span className="text-xs font-semibold text-black/40">{s.minutes} min</span>
                    </div>
                    <p className="font-display text-lg text-[var(--color-ink)]">{s.title}</p>
                    <p className="text-[13px] text-black/45 mt-1">{s.description}</p>
                  </Card>
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-semibold text-black/50 mb-3">Completed today</p>
            {completedToday.length === 0 ? (
              <EmptyState title="Nothing yet today" description="Even four minutes counts." />
            ) : (
              <div className="space-y-2">
                {completedToday.map((l) => {
                  const s = MINDFUL_SESSIONS.find((x) => x.id === l.sessionId);
                  return (
                    <div key={l.id} className="flex items-center gap-2.5 text-sm bg-white rounded-xl border border-black/5 px-4 py-2.5">
                      <CheckCircle2 size={15} className="bond-accent" />
                      <span className="text-[var(--color-ink)]">{s?.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SessionPlayer({
  session,
  onClose,
  onComplete,
}: {
  session: MindfulSession;
  onClose: () => void;
  onComplete: () => void;
}) {
  const total = session.minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            window.clearInterval(intervalRef.current!);
            setActive(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [active]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const done = remaining === 0;

  return (
    <Card className="p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide bond-accent mb-1.5">{session.title}</p>
      <p className="text-sm text-black/45 mb-6 max-w-sm mx-auto">{session.description}</p>

      <BreathingOrb active={active} />

      <p className="font-display text-3xl text-[var(--color-ink)] mt-6">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-full text-sm font-semibold text-black/50 hover:bg-black/5"
        >
          Back
        </button>
        {!done ? (
          <button
            onClick={() => setActive((a) => !a)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bond-bg-accent text-white"
          >
            {active ? <Pause size={15} /> : <Play size={15} />} {active ? 'Pause' : remaining === total ? 'Begin' : 'Resume'}
          </button>
        ) : (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bond-bg-accent text-white"
          >
            <CheckCircle2 size={15} /> Complete
          </motion.button>
        )}
        <button
          onClick={() => {
            setActive(false);
            setRemaining(total);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-black/40 hover:bg-black/5"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </Card>
  );
}
