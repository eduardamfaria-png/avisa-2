import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Event } from '../core/types';
import { isSameDay } from '../lib/dates';
import { coverLabel } from './EventCard';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function Calendar({
  month,
  events,
  selected,
  onSelect,
  onMonthChange,
}: {
  month: Date;
  events: Event[];
  selected: Date | null;
  onSelect: (d: Date) => void;
  onMonthChange: (d: Date) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const rows = days[35].getMonth() !== month.getMonth() ? days.slice(0, 35) : days;
  const today = new Date();
  const raw = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const title = raw[0].toUpperCase() + raw.slice(1);

  return (
    <div className="card cal">
      <div className="cal__head">
        <h2>{title}</h2>
        <div className="row" style={{ gap: 4 }}>
          <button className="icon-btn" aria-label="Mês anterior" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft size={20} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Hoje
          </button>
          <button className="icon-btn" aria-label="Próximo mês" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="cal__grid">
        {WEEK.map((w, i) => (
          <div key={i} className="cal__dow">
            {w}
          </div>
        ))}
        {rows.map((d) => {
          const evs = events.filter((e) => isSameDay(new Date(e.date), d));
          const out = d.getMonth() !== month.getMonth();
          const isSel = selected && isSameDay(selected, d);
          return (
            <button
              key={d.toISOString()}
              className={`cal__day${out ? ' is-out' : ''}${isSameDay(d, today) ? ' is-today' : ''}${isSel ? ' is-selected' : ''}${evs.length ? ' has-events' : ''}`}
              onClick={() => onSelect(d)}
              aria-label={`${d.toLocaleDateString('pt-BR')}${evs.length ? `: ${evs.map((e) => e.title).join(', ')}` : ''}`}
            >
              <span className="cal__num">{d.getDate()}</span>
              <span className="cal__events">
                {evs.map((e) => (
                  <span key={e.id} className="cal__chip" style={{ '--h': e.hue } as CSSProperties}>
                    <span className="cal__chip-label">{coverLabel(e)}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
