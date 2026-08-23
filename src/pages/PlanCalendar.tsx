import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, Check, Trash2, Shuffle, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Pill, Button, EmptyState } from '../components/ui';
import { DATE_IDEAS, DISCUSSION_TEMPLATES } from '../lib/content';
import type { EventType } from '../lib/types';
import { formatRelativeDate, todayStr } from '../lib/derive';

const CALENDAR_PROVIDERS = ['Google Calendar', 'Apple Calendar', 'Outlook'];

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  'meet-discuss': 'Meet & discuss',
  date: 'Date / hangout',
  ritual: 'Ritual',
};

export default function PlanCalendar() {
  const { activeBond, store, addEvent, removeEvent } = useApp();
  const [connected, setConnected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('19:00');
  const [type, setType] = useState<EventType>('meet-discuss');
  const [template, setTemplate] = useState(DISCUSSION_TEMPLATES[0].id);
  const [ideaIndex, setIdeaIndex] = useState(0);

  if (!activeBond) return null;

  const events = store.events
    .filter((e) => e.bondId === activeBond.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const upcoming = events.filter((e) => e.date >= todayStr());
  const past = events.filter((e) => e.date < todayStr());
  const ideas = DATE_IDEAS[activeBond.type];
  const idea = ideas[ideaIndex % ideas.length];

  function handleAdd() {
    if (!title.trim()) return;
    const chosenTemplate = DISCUSSION_TEMPLATES.find((t) => t.id === template);
    addEvent({
      title: title.trim(),
      date,
      time,
      type,
      notes: type === 'meet-discuss' && chosenTemplate ? chosenTemplate.steps.join(' · ') : undefined,
    });
    setTitle('');
  }

  function planIdea() {
    setType('date');
    setTitle(idea.title);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeading
        eyebrow="Plan"
        title="Make time for each other"
        description="Connect your calendars, schedule meaningful check-ins, and never run out of ideas."
      />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={16} className="bond-accent" />
          <p className="text-sm font-semibold text-black/60">Connect a calendar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CALENDAR_PROVIDERS.map((p) => {
            const isConnected = connected.includes(p);
            return (
              <button
                key={p}
                onClick={() => setConnected((c) => (isConnected ? c.filter((x) => x !== p) : [...c, p]))}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                  isConnected ? 'bond-bg-accent text-white border-transparent' : 'bg-white border-black/10 text-black/60'
                }`}
              >
                {isConnected && <Check size={13} />}
                {p}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] text-black/35 mt-3">
          Demo mode — connecting shows how vialove would surface mutual free time from your real calendars.
        </p>
      </Card>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Schedule something</p>
        <Card className="p-6">
          <div className="flex gap-2 mb-4">
            {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
              <Pill key={t} active={type === t} onClick={() => setType(t)}>
                {EVENT_TYPE_LABEL[t]}
              </Pill>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is it?"
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          {type === 'meet-discuss' && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-black/45 mb-2">Discussion template</p>
              <div className="flex gap-2 flex-wrap">
                {DISCUSSION_TEMPLATES.map((t) => (
                  <Pill key={t.id} active={template === t.id} onClick={() => setTemplate(t.id)}>
                    {t.title}
                  </Pill>
                ))}
              </div>
              <ul className="mt-3 space-y-1">
                {DISCUSSION_TEMPLATES.find((t) => t.id === template)?.steps.map((s, i) => (
                  <li key={i} className="text-[13px] text-black/50 flex gap-2">
                    <span className="bond-accent font-semibold">{i + 1}.</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleAdd} disabled={!title.trim()} className="w-full justify-center">
            <CalendarPlus size={16} /> Add to plan
          </Button>
        </Card>
      </div>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Upcoming</p>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing on the calendar yet" description="Schedule your first meet-up above." />
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-white rounded-xl border border-black/5 px-4 py-3"
              >
                <div className="w-11 h-11 rounded-lg bond-bg-soft flex flex-col items-center justify-center shrink-0 leading-none">
                  <span className="text-[10px] font-semibold bond-accent uppercase">
                    {new Date(e.date).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-ink)]">{new Date(e.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">{e.title}</p>
                  <p className="text-xs text-black/40">
                    {formatRelativeDate(e.date)} · {e.time} · {EVENT_TYPE_LABEL[e.type]}
                  </p>
                </div>
                <button onClick={() => removeEvent(e.id)} className="text-black/25 hover:text-black/50 shrink-0">
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
        {past.length > 0 && (
          <p className="text-xs text-black/30 mt-3">{past.length} past event{past.length === 1 ? '' : 's'}</p>
        )}
      </div>

      <Card className="p-6 bond-bg-soft border-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide bond-accent mb-1.5">Idea generator</p>
            <p className="font-display text-lg text-[var(--color-ink)]">{idea.title}</p>
            <p className="text-[12px] text-black/45 mt-1">
              Energy: {idea.energy} · Budget: {idea.budget}
            </p>
          </div>
          <button
            onClick={() => setIdeaIndex((i) => i + 1)}
            className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center bond-accent"
          >
            <Shuffle size={15} />
          </button>
        </div>
        <Button onClick={planIdea} size="sm" className="mt-4">
          Use this idea
        </Button>
      </Card>
    </div>
  );
}
