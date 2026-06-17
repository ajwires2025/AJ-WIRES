export function ChainLinkPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="chainlink" width="56" height="56" patternUnits="userSpaceOnUse">
          <path
            d="M0 28 Q14 0 28 28 Q42 56 56 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <path
            d="M0 0 Q14 28 28 0 Q42 -28 56 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <path
            d="M0 56 Q14 84 28 56 Q42 28 56 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chainlink)" />
    </svg>
  );
}

export function BarbedWireLine({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="12" x2="400" y2="12" stroke="currentColor" strokeWidth="1.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 16 + i * 34;
        return (
          <g key={i}>
            <line x1={x} y1="2" x2={x} y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1={x - 6} y1="6" x2={x + 6} y2="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1={x - 6} y1="18" x2={x + 6} y2="18" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}

export function DotGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}

export function CoilMotif({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" fill="none">
      {Array.from({ length: 7 }).map((_, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={20 + i * 12}
          stroke="currentColor"
          strokeWidth="2"
          opacity={1 - i * 0.11}
        />
      ))}
    </svg>
  );
}
