import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { pingsApi } from '../lib/api';
import { useBond } from '../context/BondContext';

const COOLDOWN_MS = 10_000;

/** A single-tap, zero-typing nudge — the lightest possible way to say "I'm thinking of you"
 * right now, delivered live to the partner's screen (and as a push notification if they've
 * enabled them). Distinct from the Village's support signal: this carries no weight or
 * explanation, just a small spontaneous touch. */
export function ThinkingOfYouButton({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { activeBondId, otherPerson } = useBond();
  const [justSent, setJustSent] = useState(false);
  const send = useMutation({
    mutationFn: () => pingsApi.send(activeBondId!),
    onSuccess: () => {
      setJustSent(true);
      setTimeout(() => setJustSent(false), COOLDOWN_MS);
    },
  });

  if (!otherPerson) return null;
  const disabled = send.isPending || justSent;

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => send.mutate()}
        disabled={disabled}
        title={`Let ${otherPerson.name} know you're thinking of them`}
        className={clsx(
          'fixed bottom-24 right-4 sm:hidden z-20 w-12 h-12 rounded-full shadow-[var(--shadow-lift)] flex items-center justify-center',
          justSent ? 'bond-bg-soft bond-accent' : 'bond-bg-accent text-white',
        )}
      >
        <AnimatePresence mode="wait">
          {justSent ? (
            <motion.span key="sent" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-lg">
              💗
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Heart size={20} fill="currentColor" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => send.mutate()}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
        justSent ? 'bond-bg-soft bond-accent' : 'bond-bg-accent text-white hover:brightness-105',
      )}
    >
      <AnimatePresence mode="wait">
        {justSent ? (
          <motion.span key="sent" initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex items-center gap-2">
            Sent 💗
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex items-center gap-2">
            <Heart size={15} fill="currentColor" /> Thinking of {otherPerson.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
