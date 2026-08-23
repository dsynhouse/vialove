import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export function Card({
  children,
  className,
  as: Component = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
} & Record<string, unknown>) {
  return (
    <Component
      className={clsx(
        'rounded-3xl border border-black/5 bg-white/80 backdrop-blur-sm shadow-[var(--shadow-soft)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] bond-accent mb-1.5">{eyebrow}</p>
      )}
      <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-ink)] leading-tight">{title}</h2>
      {description && <p className="text-[15px] text-black/55 mt-1.5 max-w-prose">{description}</p>}
    </div>
  );
}

export function Pill({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border',
        active
          ? 'bond-bg-accent text-white border-transparent'
          : 'bg-white text-black/60 border-black/10 hover:border-black/20',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
  size = 'md',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  size?: 'md' | 'sm';
  style?: CSSProperties;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none',
        size === 'md' ? 'px-5 py-2.5 text-sm' : 'px-3.5 py-1.5 text-xs',
        variant === 'primary' && 'bond-bg-accent text-white shadow-[var(--shadow-soft)] hover:brightness-105',
        variant === 'secondary' && 'bond-bg-soft bond-accent hover:brightness-95',
        variant === 'ghost' && 'text-black/60 hover:bg-black/5',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function VisibilityToggle({
  value,
  onChange,
}: {
  value: 'private' | 'shared';
  onChange: (v: 'private' | 'shared') => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-black/5 p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange('private')}
        className={clsx(
          'px-3 py-1.5 rounded-full transition-colors',
          value === 'private' ? 'bg-white shadow-sm text-[var(--color-ink)]' : 'text-black/45',
        )}
      >
        Private
      </button>
      <button
        type="button"
        onClick={() => onChange('shared')}
        className={clsx(
          'px-3 py-1.5 rounded-full transition-colors',
          value === 'shared' ? 'bond-bg-accent text-white shadow-sm' : 'text-black/45',
        )}
      >
        Shared
      </button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-10 px-6">
      <p className="font-display text-lg text-[var(--color-ink)]">{title}</p>
      <p className="text-sm text-black/45 mt-1">{description}</p>
    </div>
  );
}
