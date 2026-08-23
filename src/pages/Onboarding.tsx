import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sprout, Users, Users2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { BOND_TYPES } from '../lib/bondMeta';
import type { BondType } from '../lib/types';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui';

const ICONS: Record<string, typeof Heart> = { Heart, Sprout, Users, Users2, Sparkles };

export default function Onboarding() {
  const [step, setStep] = useState<'pick' | 'names'>('pick');
  const [type, setType] = useState<BondType | null>(null);
  const [label, setLabel] = useState('');
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const { createBond, store } = useApp();
  const navigate = useNavigate();

  const meta = type ? BOND_TYPES.find((b) => b.type === type)! : null;

  function handlePick(t: BondType) {
    setType(t);
    setLabel(BOND_TYPES.find((b) => b.type === t)!.label);
    setStep('names');
  }

  function handleCreate() {
    if (!type) return;
    createBond(type, label, [nameA, nameB]);
    navigate('/dashboard');
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 paper-texture"
      style={{ background: 'linear-gradient(180deg, #fbf6ef 0%, #f6ecdd 100%)' }}
    >
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <span className="inline-flex w-12 h-12 rounded-2xl items-center justify-center bg-[var(--color-ink)] text-white font-display text-xl mb-4 animate-float-slow">
            v
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--color-ink)] leading-tight">
            vialove
          </h1>
          <p className="text-black/50 mt-2 text-[15px]">
            Grow closer, together. Pick the bond you want to nurture.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'pick' && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {BOND_TYPES.map((b) => {
                const Icon = ICONS[b.icon];
                return (
                  <motion.button
                    key={b.type}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePick(b.type)}
                    className="text-left rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-shadow"
                  >
                    <span
                      className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3 text-white"
                      style={{ backgroundColor: b.theme.accent }}
                    >
                      <Icon size={19} />
                    </span>
                    <p className="font-display text-lg text-[var(--color-ink)]">{b.label}</p>
                    <p className="text-[13px] text-black/45 mt-1">{b.tagline}</p>
                  </motion.button>
                );
              })}
              {store.bonds.length > 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="sm:col-span-2 text-center text-sm text-black/40 hover:text-black/60 mt-2"
                >
                  Back to your existing bonds →
                </button>
              )}
            </motion.div>
          )}

          {step === 'names' && meta && (
            <motion.div
              key="names"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-black/5 bg-white/90 p-6 sm:p-8 shadow-[var(--shadow-soft)]"
            >
              <button
                onClick={() => setStep('pick')}
                className="flex items-center gap-1 text-sm text-black/40 hover:text-black/60 mb-5"
              >
                <ArrowLeft size={14} /> Change bond type
              </button>

              <p
                className="text-xs font-semibold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: meta.theme.accent }}
              >
                {meta.label}
              </p>
              <h2 className="font-display text-2xl text-[var(--color-ink)] mb-5">Set up this bond</h2>

              <label className="block text-sm font-medium text-black/60 mb-1.5">Give it a name</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={meta.label}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] mb-5 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as string]: meta.theme.accent }}
              />

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-black/60 mb-1.5">
                    {meta.roleLabels[0]}'s name
                  </label>
                  <input
                    value={nameA}
                    onChange={(e) => setNameA(e.target.value)}
                    placeholder="You"
                    className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as string]: meta.theme.accent }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black/60 mb-1.5">
                    {meta.roleLabels[1]}'s name
                  </label>
                  <input
                    value={nameB}
                    onChange={(e) => setNameB(e.target.value)}
                    placeholder="Them"
                    className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as string]: meta.theme.accent }}
                  />
                </div>
              </div>

              <p className="text-[13px] text-black/40 mb-6">
                You'll be able to switch between both perspectives from inside the app — perfect for
                exploring vialove before your other half joins in.
              </p>

              <Button
                onClick={handleCreate}
                className="w-full justify-center"
                style={{ backgroundColor: meta.theme.accent }}
              >
                Create this bond <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
