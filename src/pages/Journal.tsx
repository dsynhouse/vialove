import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Lock, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Pill, VisibilityToggle, Button, EmptyState } from '../components/ui';
import { REFLECTIVE_PROMPTS, FUN_PROMPTS } from '../lib/content';
import type { JournalKind, Visibility } from '../lib/types';
import { formatDay } from '../lib/derive';

export default function Journal() {
  const { activeBond, activePerson, otherPerson, store, addJournalEntry } = useApp();
  const [kind, setKind] = useState<JournalKind>('reflective');
  const [promptIndex, setPromptIndex] = useState(0);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('shared');

  const entries = useMemo(
    () =>
      !activeBond || !activePerson
        ? []
        : store.journalEntries
            .filter(
              (e) =>
                e.bondId === activeBond.id &&
                (e.visibility === 'shared' || e.authorId === activePerson.id) &&
                e.kind === kind,
            )
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.journalEntries, activeBond, activePerson, kind],
  );

  if (!activeBond || !activePerson || !otherPerson) return null;

  const prompts = kind === 'reflective' ? REFLECTIVE_PROMPTS[activeBond.type] : FUN_PROMPTS[activeBond.type];
  const prompt = prompts[promptIndex % prompts.length];

  function handleSubmit() {
    if (!content.trim()) return;
    addJournalEntry({ authorId: activePerson!.id, kind, prompt, content: content.trim(), visibility });
    setContent('');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeading
        eyebrow="Shared journal"
        title="Write it down"
        description="A page for both of you — reflective prompts for the real conversations, fun ones for the joy."
      />

      <div className="flex gap-2">
        <Pill active={kind === 'reflective'} onClick={() => { setKind('reflective'); setPromptIndex(0); }}>
          Reflective
        </Pill>
        <Pill active={kind === 'fun'} onClick={() => { setKind('fun'); setPromptIndex(0); }}>
          Just for fun
        </Pill>
      </div>

      <Card className="p-6 paper-texture relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className={kind === 'fun' ? 'font-hand text-2xl leading-snug text-[var(--color-ink)]' : 'font-display text-xl leading-snug text-[var(--color-ink)]'}>
            {prompt}
          </p>
          <button
            onClick={() => setPromptIndex((i) => i + 1)}
            className="shrink-0 w-9 h-9 rounded-full bond-bg-soft flex items-center justify-center bond-accent hover:brightness-95"
            title="Shuffle prompt"
          >
            <Shuffle size={15} />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Write as ${activePerson.name}…`}
          rows={4}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white/70"
        />

        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <VisibilityToggle value={visibility} onChange={setVisibility} />
          <Button onClick={handleSubmit} disabled={!content.trim()}>
            Add to journal
          </Button>
        </div>
      </Card>

      <div>
        <p className="text-sm font-semibold text-black/50 mb-3">Past entries</p>
        {entries.length === 0 ? (
          <EmptyState title="This page is blank, for now" description="Your first entry will show up here." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {entries.map((e) => {
                const author = [activePerson, otherPerson].find((p) => p.id === e.authorId);
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-5 h-full flex flex-col paper-texture">
                      <p className="text-[11px] font-semibold uppercase tracking-wide bond-accent mb-1.5">
                        {e.prompt}
                      </p>
                      <p
                        className={
                          e.kind === 'fun'
                            ? 'font-hand text-xl leading-snug flex-1'
                            : 'text-[15px] leading-relaxed flex-1'
                        }
                      >
                        {e.content}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                        <span className="text-xs font-medium text-black/45">
                          {author?.name} · {formatDay(e.createdAt.slice(0, 10)).split(',')[0]}
                        </span>
                        {e.visibility === 'private' ? (
                          <Lock size={13} className="text-black/30" />
                        ) : (
                          <Users size={13} className="bond-accent" />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
