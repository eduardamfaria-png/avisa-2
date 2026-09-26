export function RadarMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="logo__mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#7C5CFF" />
      <path d="M9 19a7 7 0 0 1 14 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M5 19a11 11 0 0 1 22 0" stroke="#fff" strokeOpacity=".5" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="19" r="2.6" fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <RadarMark size={size} />
      AVISÊ
    </span>
  );
}
