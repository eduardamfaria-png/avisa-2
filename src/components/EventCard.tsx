import { Calendar, Clock, MapPin, Settings2, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatBRL } from '../core/format';
import { cheapestListing } from '../core/market';
import type { Event, RadarItem } from '../core/types';
import { fmtDateLong, fmtRelative, fmtWeekdayDate } from '../lib/dates';
import { eventStatus, priceSignal, statsFor } from '../lib/status';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';
import { Countdown } from './Countdown';
import { EventCover } from './EventCover';
import { PriceDelta } from './Price';
import { RadarButton } from './RadarButton';
import { RadarModal } from './RadarModal';
import { Badge } from './StatusBadge';

export function coverLabel(event: Event) {
  return catalog.eventLabel(event);
}

function usePriceFlash(value: number | null) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (prev.current != null && value != null && value < prev.current) setFlash((f) => f + 1);
    prev.current = value;
  }, [value]);
  return flash;
}

/** Card de evento monitorado (Meu Avisê). */
export function EventCard({ event, radar }: { event: Event; radar?: RadarItem }) {
  const { world, store } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const sectorId = radar?.sectorId ?? null;
  const stats = statsFor(world.listings, world.history, event.id, sectorId);
  const signal = priceSignal(stats);
  const status = eventStatus(event);
  const city = catalog.city(event.cityId);
  const venue = catalog.venue(event.venueId);
  const sector = sectorId ? event.sectors.find((s) => s.id === sectorId)?.name : null;
  const best = cheapestListing(world.listings, event.id, sectorId);
  const flash = usePriceFlash(stats.current);
  const hitTarget = radar?.maxPrice != null && stats.current != null && stats.current <= radar.maxPrice && (event.status === 'on_sale' || event.status === 'resale');
  const updated = world.lastRunAt ?? event.updatedAt;

  return (
    <article className="card ev-card">
      <Link to={`/app/evento/${event.id}`} onClick={() => store.trackClick(event.id)} aria-label={event.title}>
        <EventCover hue={event.hue} label={coverLabel(event)}>
          <div className="ev-card__top">
            <Badge tone={status.tone} live={status.live}>
              {status.label}
            </Badge>
            {signal && signal.kind !== 'rise' && <Badge tone="green">{signal.kind === 'lowest' ? '🔥 ' : '↓ '}{signal.label}</Badge>}
          </div>
        </EventCover>
      </Link>
      <div className="ev-card__body">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="spacer">
            <Link to={`/app/evento/${event.id}`} onClick={() => store.trackClick(event.id)}>
              <h3 className="ev-card__title">{event.title}</h3>
            </Link>
            <div className="ev-card__meta" style={{ marginTop: 6 }}>
              <span>
                <MapPin /> {city?.name}
                {venue ? ` · ${venue.name}` : ''}
              </span>
              <span>
                <Calendar /> {fmtDateLong(event.date)}
              </span>
            </div>
          </div>
          {radar && (
            <button className="icon-btn" aria-label="Configurar radar" onClick={() => setEditing(true)} style={{ marginTop: -6, marginRight: -8 }}>
              <Settings2 size={19} />
            </button>
          )}
        </div>

        {status.showCountdown && event.salesStartAt && (
          <div>
            <div className="label" style={{ marginBottom: 6 }}>
              Abertura das vendas
            </div>
            <Countdown to={event.salesStartAt} size="sm" />
          </div>
        )}

        {stats.current != null ? (
          <div className="ev-card__price">
            <div>
              <div className="label">{sector ? `Menor preço · ${sector}` : 'Menor preço encontrado'}</div>
              <div key={flash} className={`price-now num${flash ? ' is-flash' : ''}`}>
                {formatBRL(stats.current)}
              </div>
              {stats.previous != null && stats.previous !== stats.current && <div className="price-old">Antes {formatBRL(stats.previous)}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <PriceDelta change={stats.change} />
              {event.currentBatch && event.status === 'on_sale' && (
                <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
                  {event.currentBatch}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ev-card__price">
            <div>
              <div className="label">Preço</div>
              <div className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
                {event.status === 'sold_out' ? 'Procurando ofertas na revenda…' : event.status === 'presale' ? 'Divulgado na abertura das vendas' : 'Ainda não divulgado'}
              </div>
            </div>
          </div>
        )}

        {radar?.maxPrice != null && (
          <div className="row" style={{ fontSize: 13 }}>
            <span className={`badge ${hitTarget ? 'badge--green' : ''}`}>🎯 Alvo {formatBRL(radar.maxPrice)}</span>
            {hitTarget && <span style={{ color: 'var(--green)', fontWeight: 600 }}>Preço atingido!</span>}
          </div>
        )}

        <div className="ev-card__foot">
          {best && (event.status === 'on_sale' || event.status === 'resale') ? (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/app/ingresso/${encodeURIComponent(best.id)}`)}>
                {status.cta}
              </button>
              <Link className="btn btn-secondary" to={`/app/evento/${event.id}`}>
                Detalhes
              </Link>
            </>
          ) : (
            <Link className="btn btn-secondary" to={`/app/evento/${event.id}`}>
              Ver detalhes
            </Link>
          )}
        </div>
        <div className="ev-card__updated">
          <Clock size={12} /> Atualizado {fmtRelative(updated)}
        </div>
      </div>
      {editing && <RadarModal event={event} onClose={() => setEditing(false)} />}
    </article>
  );
}

/** Card compacto para Explorar / busca / recomendações. */
export function EventTile({ event, reason, showRadar = true, onIgnore }: { event: Event; reason?: string; showRadar?: boolean; onIgnore?: () => void }) {
  const { world, store } = useApp();
  const status = eventStatus(event);
  const city = catalog.city(event.cityId);
  const best = cheapestListing(world.listings, event.id);
  return (
    <article className="card ev-card">
      <Link to={`/app/evento/${event.id}`} onClick={() => store.trackClick(event.id)}>
        <EventCover hue={event.hue} label={coverLabel(event)}>
          <div className="ev-card__top">
            <Badge tone={status.tone} live={status.live}>
              {status.label}
            </Badge>
          </div>
        </EventCover>
      </Link>
      <div className="ev-card__body" style={{ gap: 10 }}>
        <Link to={`/app/evento/${event.id}`} onClick={() => store.trackClick(event.id)}>
          <h3 className="ev-card__title">{event.title}</h3>
        </Link>
        <div className="ev-card__meta">
          <span>
            <MapPin /> {city?.name}
          </span>
          <span>
            <Calendar /> {fmtWeekdayDate(event.date)}
          </span>
          <span>
            <Users /> {event.watchers.toLocaleString('pt-BR')} acompanhando
          </span>
        </div>
        {reason && (
          <div className="reason" title="Por que estou vendo isso?">
            <Sparkles />
            <span className="spacer">{reason}</span>
            {onIgnore && (
              <button className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }} onClick={onIgnore}>
                Não tenho interesse
              </button>
            )}
          </div>
        )}
        <div className="row" style={{ marginTop: 'auto' }}>
          <div className="spacer">
            <div className="faint" style={{ fontSize: 12 }}>
              {best ? 'A partir de' : 'Preço'}
            </div>
            <div className="num" style={{ fontSize: 17 }}>
              {best ? formatBRL(best.price) : '—'}
            </div>
          </div>
          {showRadar && <RadarButton event={event} size="sm" short />}
        </div>
      </div>
    </article>
  );
}
