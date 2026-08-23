import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, VisibilityToggle, Button, EmptyState } from '../components/ui';
import { MoodPicker, MoodBadge } from '../components/MoodRing';
import { checkInStreak, formatDay, todayStr } from '../lib/derive';
import type { Visibility } from '../lib/types';

export default function CheckIn() {
  const { activeBond, activePerson, otherPerson, store, addCheckIn } = useApp();
  const today = todayStr();
  const existing = store.checkIns.find(
    (c) => c.bondId === activeBond?.id && c.personId === activePerson?.id && c.date === today,
  );
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [visibility, setVisibility] = useState<Visibility>(existing?.visibility ?? 'shared');
  const [saved, setSaved] = useState(false);

  if (!activeBond || !activePerson || !otherPerson) return null;

  const streak = checkInStreak(store.checkIns.filter((c) => c.bondId === activeBond.id), activePerson.id);

  const theirCheckIn = store.checkIns.find(
    (c) => c.bondId === activeBond.id && c.personId === otherPerson.id && c.date === today,
  );

  const history = store.checkIns
    .filter((c) => c.bondId === activeBond.id && c.personId === activePerson.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  function handleSave() {
    if (!mood) return;
    addCheckIn({ personId: activePerson!.id, date: today, mood: mood as 1 | 2 | 3 | 4 | 5, note, visibility });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeading
        eyebrow="Daily check-in"
        title={formatDay(today)}
        description="A quick, honest pulse on how you're doing — for you, and for this bond."
      />

      <Card className="p-6">
        <MoodPicker value={mood} onChange={setMood} />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's behind that feeling today? (optional)"
          rows={3}
          className="w-full mt-5 rounded-xl border border-black/10 px-4 py-3 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <VisibilityToggle value={visibility} onChange={setVisibility} />
          <Button onClick={handleSave} disabled={!mood}>
            {saved ? 'Saved ✓' : existing ? 'Update check-in' : 'Save check-in'}
          </Button>
        </div>
        <p className="text-[12px] text-black/35 mt-2">
          {visibility === 'private'
            ? `Only visible to you. ${otherPerson.name} will just see that you checked in.`
            : `Visible to ${otherPerson.name} too.`}
        </p>
      </Card>

      {streak > 1 && (
        <div className="flex items-center gap-2 text-sm bond-accent font-medium">
          <Flame size={16} /> {streak}-day check-in streak. Keep it going.
        </div>
      )}

      <Card className="p-6">
        <p className="text-sm font-semibold text-black/50 mb-3">{otherPerson.name}, today</p>
        {theirCheckIn ? (
          theirCheckIn.visibility === 'shared' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                <MoodBadge mood={theirCheckIn.mood} />
              </span>
              {theirCheckIn.note && <p className="text-sm text-black/60">{theirCheckIn.note}</p>}
            </div>
          ) : (
            <p className="text-sm text-black/40">Checked in privately today.</p>
          )
        ) : (
          <p className="text-sm text-black/40">Hasn't checked in yet today.</p>
        )}
      </Card>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Your history</p>
        {history.length === 0 ? (
          <EmptyState title="No check-ins yet" description="Your history will build up here day by day." />
        ) : (
          <div className="space-y-2">
            {history.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 bg-white rounded-xl border border-black/5 px-4 py-3"
              >
                <span className="text-xl">
                  <MoodBadge mood={c.mood} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-ink)]">{c.note || <span className="text-black/30">No note</span>}</p>
                </div>
                <span className="text-xs text-black/35 shrink-0">{formatDay(c.date).split(',')[0]}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
