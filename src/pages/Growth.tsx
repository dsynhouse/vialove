import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Pill, VisibilityToggle, Button, EmptyState } from '../components/ui';
import { VAULT_CATEGORY_META } from '../lib/content';
import type { VaultCategory, Visibility } from '../lib/types';
import { formatDay } from '../lib/derive';

const CATEGORIES = Object.keys(VAULT_CATEGORY_META) as VaultCategory[];

export default function Growth() {
  return (
    <div className="space-y-10 max-w-2xl">
      <SectionHeading
        eyebrow="Growth"
        title="What you're carrying, and where you're headed"
        description="A safe place for the things that are hard to say — and the goals you're building toward, together."
      />
      <GoalsSection />
      <VaultSection />
    </div>
  );
}

function GoalsSection() {
  const { activeBond, activePerson, otherPerson, store, addGoal, updateGoalProgress, cheerGoal } = useApp();
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState<'shared' | 'mine'>('shared');

  if (!activeBond || !activePerson || !otherPerson) return null;

  const goals = store.goals
    .filter((g) => g.bondId === activeBond.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleAdd() {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), ownerId: owner === 'shared' ? 'shared' : activePerson!.id, progress: 0 });
    setTitle('');
  }

  return (
    <div>
      <p className="text-sm font-semibold text-black/50 mb-3">Growth goals</p>
      <Card className="p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A goal for you, or for the two of you…"
            className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div className="flex gap-2 shrink-0">
            <Pill active={owner === 'shared'} onClick={() => setOwner('shared')}>
              Shared
            </Pill>
            <Pill active={owner === 'mine'} onClick={() => setOwner('mine')}>
              Just me
            </Pill>
            <Button onClick={handleAdd} disabled={!title.trim()}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      {goals.length === 0 ? (
        <EmptyState title="No goals yet" description="Name something you're working toward." />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const ownerPerson = g.ownerId === 'shared' ? null : [activePerson, otherPerson].find((p) => p.id === g.ownerId);
            return (
              <Card key={g.id} className="p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[15px] font-medium text-[var(--color-ink)]">{g.title}</p>
                  <span className="text-xs font-semibold text-black/40 shrink-0">
                    {ownerPerson ? ownerPerson.name : 'Shared'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-black/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bond-bg-accent"
                      initial={false}
                      animate={{ width: `${g.progress}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-black/45 w-8 text-right">{g.progress}%</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={g.progress}
                    onChange={(e) => updateGoalProgress(g.id, Number(e.target.value))}
                    className="w-2/3 accent-[var(--accent)]"
                  />
                  <button
                    onClick={() => cheerGoal(g.id, activePerson.id)}
                    className="flex items-center gap-1 text-xs font-semibold bond-accent"
                  >
                    <PartyPopper size={14} />
                    {g.cheers.length > 0 ? g.cheers.length : 'Cheer'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VaultSection() {
  const { activeBond, activePerson, otherPerson, store, addVaultEntry } = useApp();
  const [category, setCategory] = useState<VaultCategory>('dream');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');

  const entries = useMemo(
    () =>
      !activeBond || !activePerson
        ? []
        : store.vaultEntries
            .filter(
              (v) =>
                v.bondId === activeBond.id &&
                v.category === category &&
                (v.visibility === 'shared' || v.personId === activePerson.id),
            )
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.vaultEntries, activeBond, category, activePerson],
  );

  if (!activeBond || !activePerson || !otherPerson) return null;

  function handleAdd() {
    if (!content.trim()) return;
    addVaultEntry({ personId: activePerson!.id, category, content: content.trim(), visibility });
    setContent('');
  }

  const meta = VAULT_CATEGORY_META[category];

  return (
    <div>
      <p className="text-sm font-semibold text-black/50 mb-3">The vault</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
            {VAULT_CATEGORY_META[c].label}
          </Pill>
        ))}
      </div>

      <Card className="p-6 mb-4">
        <p className="text-sm text-black/45 mb-3">{meta.description}</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Write about a ${meta.label.slice(0, -1).toLowerCase()}…`}
          rows={3}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <VisibilityToggle value={visibility} onChange={setVisibility} />
          <Button onClick={handleAdd} disabled={!content.trim()}>
            Add to vault
          </Button>
        </div>
        <p className="text-[12px] text-black/35 mt-2">
          Keep it private until you're ready, or share it the moment you write it — disclosure is always your
          call.
        </p>
      </Card>

      {entries.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Whatever you write stays exactly as visible as you choose." />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {entries.map((e) => {
              const author = [activePerson, otherPerson].find((p) => p.id === e.personId);
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border-l-4 bg-white p-4"
                  style={{ borderLeftColor: meta.color }}
                >
                  <p className="text-[15px] text-[var(--color-ink)] leading-relaxed">{e.content}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs font-medium text-black/40">
                      {author?.name} · {formatDay(e.createdAt.slice(0, 10)).split(',')[0]}
                    </span>
                    {e.visibility === 'private' ? (
                      <Lock size={12} className="text-black/30" />
                    ) : (
                      <Users size={12} className="bond-accent" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
