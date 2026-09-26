import { TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBRL } from '../core/format';
import { fmtWeekdayDate } from '../lib/dates';
import type { Opportunity } from '../services/recommendations';
import { catalog } from '../services/catalog';
import { EventCover } from './EventCover';
import { PriceFlow } from './Price';
import { Badge } from './StatusBadge';

const TONE: Record<Opportunity['kind'], 'green' | 'yellow' | 'purple' | 'red' | 'blue'> = {
  price_drop: 'green',
  new_lowest: 'green',
  last_tickets: 'red',
  new_batch: 'yellow',
  resale: 'purple',
  soon: 'blue',
  sales_soon: 'yellow',
};

/** Card de "Últimas oportunidades" (queda, novo menor preço, últimos ingressos…). */
export function PriceDropCard({ o }: { o: Opportunity }) {
  const sector = o.sectorId ? o.event.sectors.find((s) => s.id === o.sectorId)?.name : null;
  return (
    <Link to={`/app/evento/${o.event.id}`} className="card ev-card" style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <EventCover hue={o.event.hue} style={{ width: 88, flex: 'none' }} />
      <div className="ev-card__body" style={{ gap: 6, padding: 14 }}>
        <Badge tone={TONE[o.kind]}>
          {o.kind === 'new_lowest' ? '🔥' : o.kind === 'price_drop' ? <TrendingDown /> : null} {o.label}
        </Badge>
        <strong style={{ fontSize: 15 }}>{o.event.title}</strong>
        <span className="faint" style={{ fontSize: 12.5 }}>
          {sector ? `${sector} · ` : ''}
          {catalog.city(o.event.cityId)?.name} · {fmtWeekdayDate(o.event.date)}
        </span>
        {o.from != null && o.to != null ? (
          <div className="row" style={{ marginTop: 4 }}>
            <PriceFlow from={o.from} to={o.to} />
            <span className="delta delta--down">-{formatBRL(o.from - o.to)}</span>
          </div>
        ) : null}
        <span className="link" style={{ marginTop: 2 }}>
          Ver oportunidade →
        </span>
      </div>
    </Link>
  );
}
