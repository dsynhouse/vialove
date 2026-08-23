import type { CSSProperties } from 'react';
import clsx from 'clsx';

/**
 * Shared hand-drawn heart outline — asymmetric lobes (right lobe taller and
 * more pointed than the left), matching the brand mark. Reused at emblem size
 * (LogoMark) and inline, standing in for the second "o" (Wordmark).
 */
const HEART_PATH =
  'M58 100C30 78 6 58 8 35 9 18 26 8 42 14 52 18 57 28 58 38 60 26 68 12 84 10 100 8 112 22 108 40 104 60 82 80 58 100Z';

function Heart({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 110" className={className} style={style} fill="none" aria-hidden>
      <path
        d={HEART_PATH}
        stroke="var(--logo-ink, #7d1f2e)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The emblem: a hand-drawn heart breaking out of a soft blob backdrop —
 * used for the favicon, sidebar mark, and anywhere space is tight.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="vialove"
      className={className}
    >
      <path
        d="M60 10c19 0 38 5 47 20 7 13 5 29-3 41-9 14-25 24-42 25-19 1-40-6-48-22C6 60 8 42 19 29 29 17 43 10 60 10Z"
        fill="var(--logo-blob, #eab6a6)"
      />
      <path
        d={HEART_PATH}
        transform="translate(2 4) scale(0.86)"
        stroke="var(--logo-ink, #7d1f2e)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The wordmark: "vialove" hand-lettered, with the second "o" swapped for the
 * open heart. Used on auth screens and other hero brand moments.
 */
export function Wordmark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx('inline-flex items-center font-display font-extrabold', className)}
      style={{ color: 'var(--logo-ink, #7d1f2e)', fontSize: size }}
    >
      vial
      <Heart
        style={{
          width: '0.82em',
          height: '0.75em',
          margin: '0 0.02em',
          transform: 'translateY(0.04em)',
        }}
      />
      ve
    </span>
  );
}
