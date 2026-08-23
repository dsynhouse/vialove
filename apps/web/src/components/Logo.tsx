import clsx from 'clsx';

/**
 * Hand-lettered "vialove" wordmark: bold rounded type on a soft blob backdrop,
 * with the second "o" swapped for a heart outline — mirrors the brand mark.
 */
export function LogoMark({
  size = 40,
  showTagline = false,
  className,
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="vialove"
      >
        <path
          d="M50 8c15 0 32 4 39 17 6 11 4 24-2 34-7 12-20 20-35 21-16 1-33-5-40-18C6 51 8 36 17 25 25 15 37 8 50 8Z"
          fill="var(--logo-blob, #e9b7ab)"
        />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="'Caveat', cursive"
          fontWeight="700"
          fontSize="34"
          fill="var(--logo-ink, #7a1f2b)"
        >
          v
        </text>
        <path
          d="M67 44c3-3 8-3 10 0 2 3 1 7-2 10l-8 8-8-8c-3-3-4-7-2-10 2-3 7-3 10 0Z"
          fill="none"
          stroke="var(--logo-ink, #7a1f2b)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      {showTagline && (
        <span className="font-hand text-[13px] leading-none text-[var(--logo-ink,#7a1f2b)] -mt-0.5">
          a new era of growth
        </span>
      )}
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-baseline font-hand font-semibold', className)}>
      vial
      <HeartO />
      ve
    </span>
  );
}

function HeartO() {
  return (
    <svg width="0.75em" height="0.75em" viewBox="0 0 24 24" className="inline-block mx-[0.02em] translate-y-[0.05em]" aria-hidden>
      <path
        d="M12 20 3 12.5C0.5 10.2 0.8 6.4 3.6 4.6 5.6 3.3 8.2 3.7 9.9 5.6L12 8l2.1-2.4c1.7-1.9 4.3-2.3 6.3-1 2.8 1.8 3.1 5.6 0.6 7.9L12 20Z"
        fill="currentColor"
      />
    </svg>
  );
}
