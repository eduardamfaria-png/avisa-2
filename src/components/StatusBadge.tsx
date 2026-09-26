import type { Event } from '../core/types';
import { eventStatus, type Tone } from '../lib/status';

export function Badge({ tone = 'neutral', live, children }: { tone?: Tone; live?: boolean; children: React.ReactNode }) {
  return <span className={`badge badge--${tone}${live ? ' badge--live' : ''}`}>{children}</span>;
}

export function StatusBadge({ event, now }: { event: Event; now?: Date }) {
  const s = eventStatus(event, now);
  return (
    <Badge tone={s.tone} live={s.live}>
      {s.label}
    </Badge>
  );
}
