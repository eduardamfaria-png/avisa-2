import { useNow } from '../state/hooks';
import { countdownParts } from '../lib/dates';

export function Countdown({ to, size = 'md' }: { to: string; size?: 'sm' | 'md' }) {
  const now = useNow(1000);
  const c = countdownParts(to, now);
  if (c.done) return <span className="badge badge--green badge--live">Começou agora</span>;
  const units: [number, string][] = [
    [c.days, 'dias'],
    [c.hours, 'h'],
    [c.minutes, 'min'],
    [c.seconds, 's'],
  ];
  return (
    <div className={`countdown${size === 'sm' ? ' countdown--sm' : ''}`} role="timer" aria-label={`Faltam ${c.days} dias e ${c.hours} horas`}>
      {units.map(([v, l]) => (
        <div className="cd-unit" key={l}>
          <b>{String(v).padStart(2, '0')}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}
