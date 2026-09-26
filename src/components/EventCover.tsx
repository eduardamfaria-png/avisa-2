import type { CSSProperties, ReactNode } from 'react';

/** Capa gerada (sem imagens de terceiros): cor do artista + anéis de radar. */
export function EventCover({ hue, label, className = '', children, style }: { hue: number; label?: string; className?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`cover ${className}`} style={{ '--h': hue, ...style } as CSSProperties}>
      <svg className="cover__rings" viewBox="0 0 100 100" aria-hidden>
        {[12, 22, 32, 42, 49].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeWidth="0.6" />
        ))}
      </svg>
      {label && <span className="cover__label">{label}</span>}
      {children}
    </div>
  );
}
