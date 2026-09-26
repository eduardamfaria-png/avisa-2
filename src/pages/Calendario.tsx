import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Calendar } from '../components/Calendar';
import { Countdown } from '../components/Countdown';
import { EventCover } from '../components/EventCover';
import { coverLabel } from '../components/EventCard';
import { PriceFlow } from '../components/Price';
import { formatBRL } from '../core/format';
import { cheapestListing } from '../core/market';
import type { Event } from '../core/types';
import { daysUntil, fmtTime, isSameDay } from '../lib/dates';
import { priceSignal, statsFor } from '../lib/status';
import { catalog } from '../services/catalog';
import { useApp, useNow } from '../state/hooks';

/** Card dinâmico: muda conforme o status do evento. */
function DynamicCard({ event }: { event: Event }) {
  const { world, data } = useApp();
  const now = useNow(30_000);
  const radar = data?.radar.find((r) => r.eventId === event.id);
  const stats = statsFor(world.listings, world.history, event.id, radar?.sectorId ?? null);
  const signal = priceSignal(stats);
  const best = cheapestListing(world.listings, event.id, radar?.sectorId ?? null);
  const d = daysUntil(event.date, now);

  let icon = '📅';
  let title = 'Evento anunciado';
  let body: React.ReactNode = 'Aguardando informações de venda.';
  let tone = 'blue';
  if (event.status === 'presale' && event.salesStartAt) {
    const sd = daysUntil(event.salesStartAt, now);
    icon = '⏰';
    tone = 'yellow';
    title = sd <= 0 ? `Vendas começam hoje às ${fmtTime(event.salesStartAt)}` : sd === 1 ? 'Vendas abrem amanhã' : `Vendas abrem em ${sd} dias`;
    body = <Countdown to={event.salesStartAt} size="sm" />;
  } else if (signal && signal.kind !== 'rise' && stats.previous != null && stats.current != null) {
    icon = '📉';
    tone = 'green';
    title = 'O preço caiu';
    body = <PriceFlow from={stats.previous} to={stats.current} />;
  } else if (event.status === 'on_sale') {
    icon = '🎟️';
    tone = 'green';
    title = 'Ingressos disponíveis';
    body = best ? `A partir de ${formatBRL(best.price)}${event.currentBatch ? ` · ${event.currentBatch}` : ''}` : 'Vendas abertas';
  } else if (event.status === 'resale') {
    icon = '🎫';
    tone = 'purple';
    title = 'Encontramos ingressos na revenda';
    body = best ? `A partir de ${formatBRL(best.price)}` : '';
  } else if (event.status === 'sold_out') {
    icon = '⚠️';
    tone = 'red';
    title = 'Ingressos oficiais esgotados';
    body = 'Seguimos de olho na revenda.';
  }

  return (
    <Link to={`/app/evento/${event.id}`} className={`card dyn-card dyn-card--${tone}`}>
      <EventCover hue={event.hue} className="dyn-card__date">
        <b>{new Date(event.date).getDate()}</b>
        <span>{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
      </EventCover>
      <div className="spacer" style={{ minWidth: 0 }}>
        <div className="faint" style={{ fontSize: 12 }}>
          {catalog.cityName(event.cityId)} · {d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`}
        </div>
        <strong style={{ display: 'block' }}>{event.title}</strong>
        <div className="dyn-card__status">
          {icon} {title}
        </div>
        <div style={{ marginTop: 6, fontSize: 14 }} className="muted">
          {body}
        </div>
      </div>
    </Link>
  );
}

export function Calendario() {
  const { world, data } = useApp();
  const events = (data?.radar ?? [])
    .map((r) => world.events.find((e) => e.id === r.eventId))
    .filter((e): e is Event => !!e)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = events.find((e) => new Date(e.date) >= new Date());
  const [month, setMonth] = useState(() => {
    const d = first ? new Date(first.date) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Date | null>(null);

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });
  const shown = selected ? events.filter((e) => isSameDay(new Date(e.date), selected)) : monthEvents;
  const upcoming = events.filter((e) => new Date(e.date) >= new Date());

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendário</h1>
          <p>Só os eventos do seu Avisê. Nada de agenda genérica.</p>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="empty">
          <h3>Nenhum evento no seu Radar</h3>
          <p>Quando você adicionar eventos ao Meu Avisê, eles aparecem aqui.</p>
          <Link to="/app/explorar" className="btn btn-primary">
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="cal-layout">
          <div>
            <Calendar
              month={month}
              events={events}
              selected={selected}
              onSelect={(d) => setSelected(selected && isSameDay(selected, d) ? null : d)}
              onMonthChange={(m) => {
                setMonth(m);
                setSelected(null);
              }}
            />
            <div className="cal-month-list">
              <h3>{month.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</h3>
              {monthEvents.length === 0 && <p className="faint">Nenhum evento seu neste mês.</p>}
              {monthEvents.map((e) => (
                <Link to={`/app/evento/${e.id}`} key={e.id}>
                  <b className="num">{new Date(e.date).getDate()}</b> — {coverLabel(e)}
                  <span className="faint"> · {catalog.cityName(e.cityId)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="stack">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <h2>{selected ? selected.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : 'Próximos do seu Radar'}</h2>
              {selected && (
                <button className="link" onClick={() => setSelected(null)}>
                  Ver todos
                </button>
              )}
            </div>
            {(selected ? shown : upcoming).length === 0 && <p className="muted">Nenhum evento nesta data.</p>}
            {(selected ? shown : upcoming).map((e) => (
              <DynamicCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
