import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Sun, BookHeart, Sprout, ClipboardCheck, Wind, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, EmptyState } from '../components/ui';
import { computeBadges } from '../lib/badges';
import { checkInStreak } from '../lib/derive';
import { MINDFUL_SESSIONS } from '../lib/content';

interface TimelineItem {
  id: string;
  date: string;
  icon: typeof Sun;
  title: string;
  detail?: string;
}

export default function Profile() {
  const { activeBond, activePerson, otherPerson, store } = useApp();

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!activeBond || !activePerson) return [];
    const items: TimelineItem[] = [];

    store.checkIns
      .filter((c) => c.bondId === activeBond.id && c.personId === activePerson.id)
      .forEach((c) =>
        items.push({
          id: c.id,
          date: c.createdAt,
          icon: Sun,
          title: 'Checked in',
          detail: c.note || undefined,
        }),
      );

    store.journalEntries
      .filter((j) => j.bondId === activeBond.id && j.authorId === activePerson.id)
      .forEach((j) =>
        items.push({ id: j.id, date: j.createdAt, icon: BookHeart, title: 'Journal entry', detail: j.prompt }),
      );

    store.vaultEntries
      .filter((v) => v.bondId === activeBond.id && v.personId === activePerson.id)
      .forEach((v) =>
        items.push({
          id: v.id,
          date: v.createdAt,
          icon: Sprout,
          title: `Added to the vault (${v.category})`,
        }),
      );

    store.weeklyPulses
      .filter((w) => w.bondId === activeBond.id && w.responses[activePerson.id])
      .forEach((w) =>
        items.push({
          id: w.id,
          date: w.responses[activePerson.id].submittedAt,
          icon: ClipboardCheck,
          title: 'Submitted weekly pulse',
        }),
      );

    store.mindfulLogs
      .filter((l) => l.bondId === activeBond.id && l.personId === activePerson.id)
      .forEach((l) =>
        items.push({
          id: l.id,
          date: l.completedAt,
          icon: Wind,
          title: `Completed "${MINDFUL_SESSIONS.find((s) => s.id === l.sessionId)?.title}"`,
        }),
      );

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [store, activeBond, activePerson]);

  if (!activeBond || !activePerson || !otherPerson) return null;

  const badges = computeBadges(store, activeBond.id, activePerson.id);
  const earnedCount = badges.filter((b) => b.earned).length;
  const streak = checkInStreak(store.checkIns.filter((c) => c.bondId === activeBond.id), activePerson.id);

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeading eyebrow="Profile" title={activePerson.name} description={`Your growth inside ${activeBond.label}.`} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Day streak" value={streak} />
        <StatCard label="Badges" value={`${earnedCount}/${badges.length}`} />
        <StatCard label="Timeline events" value={timeline.length} />
      </div>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Badges</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={`p-4 text-center ${b.earned ? '' : 'opacity-40 grayscale'}`}
            >
              <div className="w-9 h-9 rounded-full bond-bg-soft bond-accent flex items-center justify-center mx-auto mb-2">
                {b.earned ? <Award size={16} /> : <Lock size={14} />}
              </div>
              <p className="text-[12px] font-semibold text-[var(--color-ink)]">{b.label}</p>
              <p className="text-[10px] text-black/40 mt-0.5 leading-tight">{b.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Your timeline</p>
        {timeline.length === 0 ? (
          <EmptyState title="Nothing yet" description="Everything you do in this bond will build your story here." />
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-black/10">
            {timeline.slice(0, 40).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="relative"
              >
                <span className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bond-bg-accent text-white flex items-center justify-center">
                  <item.icon size={10} />
                </span>
                <p className="text-sm font-medium text-[var(--color-ink)]">{item.title}</p>
                {item.detail && <p className="text-[13px] text-black/45 truncate">{item.detail}</p>}
                <p className="text-[11px] text-black/30">{new Date(item.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 text-center">
      <p className="font-display text-2xl text-[var(--color-ink)]">{value}</p>
      <p className="text-[11px] text-black/45 mt-0.5">{label}</p>
    </Card>
  );
}
