import { motion } from 'framer-motion';
import clsx from 'clsx';

const MOODS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: '🌧️', label: 'Struggling' },
  { value: 2, emoji: '🌥️', label: 'Low' },
  { value: 3, emoji: '⛅', label: 'Steady' },
  { value: 4, emoji: '🌤️', label: 'Good' },
  { value: 5, emoji: '☀️', label: 'Radiant' },
];

export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className="flex flex-col items-center gap-1.5 group"
        >
          <motion.span
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={clsx(
              'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full text-2xl transition-all',
              value === m.value
                ? 'bond-bg-soft ring-2 ring-offset-2 bond-border-accent scale-105'
                : 'bg-black/[0.03] grayscale opacity-60 hover:opacity-100 hover:grayscale-0',
            )}
            style={value === m.value ? { boxShadow: '0 0 0 2px var(--accent)' } : undefined}
          >
            {m.emoji}
          </motion.span>
          <span
            className={clsx(
              'text-[11px] font-medium',
              value === m.value ? 'bond-accent' : 'text-black/40',
            )}
          >
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function MoodBadge({ mood }: { mood: number }) {
  const m = MOODS.find((x) => x.value === mood);
  return <span title={m?.label}>{m?.emoji}</span>;
}

export function BreathingOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full bond-bg-soft"
        animate={active ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 4.5, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-4 rounded-full bond-bg-accent opacity-80"
        animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 4.5, repeat: active ? Infinity : 0, ease: 'easeInOut', delay: 0.1 }}
      />
      <span className="relative z-10 text-white font-display text-sm">
        {active ? 'breathe' : 'ready'}
      </span>
    </div>
  );
}
