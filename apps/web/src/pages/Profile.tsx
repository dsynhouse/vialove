import { motion } from 'framer-motion';
import { Award, Sun, BookHeart, Sprout, ClipboardCheck, Wind, Lock } from 'lucide-react';
import { useBond } from '../context/BondContext';
import { useTimeline } from '../lib/queries';
import { Card, SectionHeading, EmptyState, Skeleton } from '../components/ui';
import type { TimelineItem } from '../lib/types';

const TYPE_ICON: Record<TimelineItem['type'], typeof Sun> = {
  checkin: Sun,
  journal: BookHeart,
  vault: Sprout,
  pulse: ClipboardCheck,
  mindful: Wind,
};

export default function Profile() {
  const { activeBond, activePerson } = useBond();
  const { data, isLoading } = useTimeline(activeBond?.id);

  if (!activeBond || !activePerson) return null;

  const badges = data?.badges ?? [];
  const timeline = data?.timeline ?? [];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeading eyebrow="Profile" title={activePerson.name} description={`Your growth inside ${activeBond.label}.`} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Day streak" value={data?.streak ?? 0} />
        <StatCard label="Badges" value={`${earnedCount}/${badges.length || 8}`} />
        <StatCard label="Timeline events" value={timeline.length} />
      </div>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Badges</p>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b) => (
              <Card key={b.id} className={`p-4 text-center ${b.earned ? '' : 'opacity-40 grayscale'}`}>
                <div className="w-9 h-9 rounded-full bond-bg-soft bond-accent flex items-center justify-center mx-auto mb-2">
                  {b.earned ? <Award size={16} /> : <Lock size={14} />}
                </div>
                <p className="text-[12px] font-semibold text-[var(--color-ink)]">{b.label}</p>
                <p className="text-[10px] text-black/40 mt-0.5 leading-tight">{b.description}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Your timeline</p>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : timeline.length === 0 ? (
          <EmptyState title="Nothing yet" description="Everything you do in this bond will build your story here." />
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-black/10">
            {timeline.slice(0, 40).map((item, i) => {
              const Icon = TYPE_ICON[item.type];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="relative"
                >
                  <span className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bond-bg-accent text-white flex items-center justify-center">
                    <Icon size={10} />
                  </span>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{item.title}</p>
                  {item.detail && <p className="text-[13px] text-black/45 truncate">{item.detail}</p>}
                  <p className="text-[11px] text-black/30">
                    {new Date(item.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </motion.div>
              );
            })}
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
