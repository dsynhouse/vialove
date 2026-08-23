import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Hourglass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Button, EmptyState } from '../components/ui';
import { WEEKLY_QUESTIONS } from '../lib/content';
import { mondayOf } from '../lib/derive';
import type { WeeklyResponse } from '../lib/types';

type DraftResponse = Omit<WeeklyResponse, 'submittedAt'>;

const EMPTY_RESPONSE: DraftResponse = {
  appreciation: '',
  friction: '',
  request: '',
  win: '',
  tryThis: '',
};

export default function WeeklyPulse() {
  const { activeBond, activePerson, otherPerson, store, submitWeeklyResponse } = useApp();
  const weekOf = mondayOf();
  const [form, setForm] = useState(EMPTY_RESPONSE);

  if (!activeBond || !activePerson || !otherPerson) return null;

  const currentPulse = store.weeklyPulses.find((w) => w.bondId === activeBond.id && w.weekOf === weekOf);
  const mySubmitted = !!currentPulse?.responses[activePerson.id];
  const theirSubmitted = !!currentPulse?.responses[otherPerson.id];
  const bothSubmitted = mySubmitted && theirSubmitted;

  const pastPulses = store.weeklyPulses
    .filter((w) => w.bondId === activeBond.id && w.weekOf !== weekOf)
    .sort((a, b) => b.weekOf.localeCompare(a.weekOf));

  function handleSubmit() {
    submitWeeklyResponse(weekOf, activePerson!.id, form);
    setForm(EMPTY_RESPONSE);
  }

  const weekLabel = new Date(weekOf).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeading
        eyebrow="Weekly pulse"
        title={`Week of ${weekLabel}`}
        description="Five honest questions. Answers stay hidden until you've both submitted — so neither of you reacts to the other."
      />

      {!mySubmitted ? (
        <Card className="p-6 space-y-5">
          {WEEKLY_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">{q.label}</label>
              <textarea
                value={form[q.key]}
                onChange={(e) => setForm((f) => ({ ...f, [q.key]: e.target.value }))}
                placeholder={q.placeholder}
                rows={2}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          ))}
          <Button
            onClick={handleSubmit}
            disabled={Object.values(form).every((v) => !v.trim())}
            className="w-full justify-center"
          >
            Submit for this week
          </Button>
        </Card>
      ) : !bothSubmitted ? (
        <Card className="p-8 text-center bond-bg-soft border-none">
          <Hourglass size={22} className="bond-accent mx-auto mb-3" />
          <p className="font-display text-lg text-[var(--color-ink)]">You're in.</p>
          <p className="text-sm text-black/50 mt-1">
            Waiting on {otherPerson.name} to submit before you both see the answers.
          </p>
        </Card>
      ) : (
        <PulseReveal weekLabel={weekLabel} responses={currentPulse!.responses} people={[activePerson, otherPerson]} />
      )}

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Past weeks</p>
        {pastPulses.length === 0 ? (
          <EmptyState title="No history yet" description="Past weeks will build a picture of how you're growing." />
        ) : (
          <div className="space-y-4">
            {pastPulses.map((p) => (
              <PulseReveal
                key={p.id}
                weekLabel={new Date(p.weekOf).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                responses={p.responses}
                people={[activePerson, otherPerson]}
                collapsedByDefault
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PulseReveal({
  weekLabel,
  responses,
  people,
  collapsedByDefault,
}: {
  weekLabel: string;
  responses: Record<string, WeeklyResponse>;
  people: [{ id: string; name: string }, { id: string; name: string }];
  collapsedByDefault?: boolean;
}) {
  const [open, setOpen] = useState(!collapsedByDefault);
  return (
    <Card className="p-6">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full">
        <span className="flex items-center gap-2 font-display text-lg text-[var(--color-ink)]">
          <CheckCircle2 size={16} className="bond-accent" /> {weekLabel}
        </span>
        <span className="text-xs text-black/35">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 gap-4 mt-4">
          {people.map((person) => {
            const r = responses[person.id];
            return (
              <div key={person.id} className="rounded-xl bg-black/[0.02] p-4">
                <p className="text-xs font-semibold text-black/45 mb-2.5">{person.name}</p>
                {r ? (
                  <div className="space-y-2.5">
                    {WEEKLY_QUESTIONS.map((q) => (
                      <div key={q.key}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide bond-accent">{q.label}</p>
                        <p className="text-sm text-[var(--color-ink)]">{r[q.key] || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-black/35">Didn't submit this week.</p>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </Card>
  );
}
