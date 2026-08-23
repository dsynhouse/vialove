import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, CalendarClock, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components/ui';
import { MoodBadge } from '../components/MoodRing';
import { checkInStreak, formatRelativeDate, todayStr } from '../lib/derive';
import { bondMeta } from '../lib/bondMeta';
import { DATE_IDEAS } from '../lib/content';

export default function Dashboard() {
  const { activeBond, activePerson, otherPerson, store } = useApp();
  if (!activeBond || !activePerson || !otherPerson) return null;

  const today = todayStr();
  const myCheckIn = store.checkIns.find(
    (c) => c.bondId === activeBond.id && c.personId === activePerson.id && c.date === today,
  );
  const theirCheckIn = store.checkIns.find(
    (c) => c.bondId === activeBond.id && c.personId === otherPerson.id && c.date === today,
  );
  const myStreak = checkInStreak(
    store.checkIns.filter((c) => c.bondId === activeBond.id),
    activePerson.id,
  );

  const upcoming = store.events
    .filter((e) => e.bondId === activeBond.id && `${e.date}T${e.time}` >= new Date().toISOString().slice(0, 16))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 2);

  const meta = bondMeta(activeBond.type);
  const idea = DATE_IDEAS[activeBond.type][new Date().getDate() % DATE_IDEAS[activeBond.type].length];

  const sharedJournalCount = store.journalEntries.filter(
    (j) => j.bondId === activeBond.id && j.visibility === 'shared',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] bond-accent mb-1.5">
            {activeBond.label === meta.label ? meta.label : `${meta.label} · ${activeBond.label}`}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
            Hi {activePerson.name}
          </h1>
          <p className="text-black/50 mt-1 text-[15px]">{meta.tagline}</p>
        </div>
        {myStreak > 0 && (
          <div className="flex items-center gap-1.5 bond-bg-soft bond-accent px-3.5 py-2 rounded-full text-sm font-semibold">
            <Flame size={16} /> {myStreak} day streak
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm font-semibold text-black/50 mb-3">Today's check-in</p>
          <div className="flex items-center justify-between">
            <PersonMoodRow name={activePerson.name} mood={myCheckIn?.mood} done={!!myCheckIn} />
            <PersonMoodRow name={otherPerson.name} mood={theirCheckIn?.visibility === 'shared' ? theirCheckIn.mood : undefined} done={!!theirCheckIn} muted={theirCheckIn?.visibility !== 'shared'} />
          </div>
          <Link to="/check-in">
            <Button size="sm" variant={myCheckIn ? 'secondary' : 'primary'} className="mt-4 w-full justify-center">
              {myCheckIn ? 'Update your check-in' : 'Check in now'} <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-black/50 mb-3">Coming up</p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-black/40 py-2">Nothing scheduled yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 text-sm">
                  <CalendarClock size={15} className="bond-accent shrink-0" />
                  <span className="text-[var(--color-ink)] font-medium truncate">{e.title}</span>
                  <span className="text-black/40 ml-auto shrink-0">{formatRelativeDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/calendar">
            <Button size="sm" variant="secondary" className="mt-4 w-full justify-center">
              Plan time together <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink
          to="/journal"
          title="Shared journal"
          desc={`${sharedJournalCount} shared ${sharedJournalCount === 1 ? 'entry' : 'entries'} so far`}
        />
        <QuickLink to="/growth" title="Growth & goals" desc="Dreams, fears, and progress" />
        <QuickLink to="/pulse" title="Weekly pulse" desc="This week's reflection" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 flex items-center gap-4 bond-bg-soft border-none">
          <div className="w-10 h-10 rounded-full bond-bg-accent text-white flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Idea for today</p>
            <p className="text-sm text-black/60">{idea.title}</p>
          </div>
          <Link to="/calendar">
            <Button size="sm" variant="primary">
              Plan it
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
}

function PersonMoodRow({
  name,
  mood,
  done,
  muted,
}: {
  name: string;
  mood?: number;
  done: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
          done ? 'bond-bg-soft' : 'bg-black/[0.04]'
        }`}
      >
        {mood ? <MoodBadge mood={mood} /> : done ? '🔒' : '—'}
      </div>
      <span className="text-xs font-medium text-black/50 truncate max-w-[80px]">{name}</span>
      {muted && done && <span className="text-[10px] text-black/30">private</span>}
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="p-5 h-full hover:shadow-[var(--shadow-lift)] transition-shadow">
        <p className="font-display text-lg text-[var(--color-ink)]">{title}</p>
        <p className="text-[13px] text-black/45 mt-1">{desc}</p>
      </Card>
    </Link>
  );
}
