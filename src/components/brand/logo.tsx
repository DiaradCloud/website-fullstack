export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 23c-3.5 0-5.5-3-4-5.5C2.5 15 5.5 12.5 8 12.5 9 9.5 11.5 8 16 8s7 1.5 8 4.5c2.5 0 5.5 2.5 4 5 1.5 2.5-.5 5.5-4 5.5H8z"
        stroke="url(#diarad-logo-gradient)"
        strokeWidth="1.2"
      />
      <circle cx="16" cy="6" r="1.7" className="fill-warning" />
      <defs>
        <linearGradient id="diarad-logo-gradient" x1="3" y1="8" x2="29" y2="23">
          <stop stopColor="oklch(0.56 0.219 258)" />
          <stop offset="1" stopColor="oklch(0.6 0.22 295)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
      <Logo className="size-6" />
      {!compact && (
        <span>
          <span className="text-primary">D</span>iarad Cloud
        </span>
      )}
    </span>
  );
}
