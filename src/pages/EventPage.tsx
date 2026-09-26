import { ArrowLeft, Bell, Calendar, Clock, ExternalLink, MapPin, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link, useGoBack } from '../lib/links';
import { Countdown } from '../components/Countdown';
import { DemoNotice } from '../components/DemoNotice';
import { EventCover } from '../components/EventCover';
import { FollowButton } from '../components/FollowButton';
import { PriceDelta } from '../components/Price';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { RadarButton } from '../components/RadarButton';
import { Badge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { formatBRL } from '../core/format';
import { availableListings, cheapestListing } from '../core/market';
import { fmtDayMonth, fmtTime } from '../lib/dates';
import { eventStatus, priceSignal, statsFor } from '../lib/status';
import { catalog } from '../services/catalog';
import { forYou } from '../services/recommendations';
import { CATEGORY_LABEL } from '../services/search';
import { useApp, useRequireAuth } from '../state/hooks';

export function EventPage() {
  const { id } = useParams();
  const { world, data, store } = useApp();
  const goBack = useGoBack('/app/explorar');
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const [alertOpen, setAlertOpen] = useState(false);
  const event = world.events.find((e) => e.id === id);
  const radar = data?.radar.find((r) => r.eventId === id);

  const defaultSector = radar?.sectorId ?? (event ? cheapestListing(world.listings, event.id)?.sectorId ?? event.sectors[0]?.id : '') ?? '';
  const [sectorId, setSectorId] = useState(defaultSector);
  useEffect(() => setSectorId(defaultSector), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id && data) store.trackClick(id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event)
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <h3>Evento não encontrado</h3>
        <p>Ele pode ainda não ter sido anunciado nesta simulação.</p>
        <Link to="/app/explorar" className="btn btn-primary">
          Explorar eventos
        </Link>
      </div>
    );

  const status = eventStatus(event);
  const city = catalog.city(event.cityId);
  const venue = catalog.venue(event.venueId);
  const artists = catalog.eventArtists(event);
  const stats = statsFor(world.listings, world.history, event.id, sectorId || null);
  const signal = priceSignal(stats);
  const target = radar?.sectorId === sectorId || !radar?.sectorId ? radar?.maxPrice : null;
  const reason = !radar ? forYou(world, data).find((r) => r.event.id === event.id)?.reason : null;
  const listings = availableListings(world.listings, event.id);
  // Se o usuário monitora um setor específico, o destaque de preço é desse setor.
  const best = (radar?.sectorId ? cheapestListing(world.listings, event.id, radar.sectorId) : null) ?? cheapestListing(world.listings, event.id);
  const sourcesHere = catalog.sources.filter((s) => world.listings.some((l) => l.eventId === event.id && l.sourceId === s.id));
  const date = new Date(event.date);
  const recentPoints = [...stats.points].reverse().slice(0, 6);

  return (
    <div className="event-page">
      <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginLeft: -10, marginBottom: 10 }}>
        <ArrowLeft size={17} /> Voltar
      </button>

      <EventCover hue={event.hue} className="event-hero">
        <div className="event-hero__inner">
          <div className="row wrap">
            <Badge tone={status.tone} live={status.live}>
              {status.label}
            </Badge>
            {signal && signal.kind !== 'rise' && <Badge tone="green">{signal.kind === 'lowest' ? '🔥 ' : '↓ '}{signal.label}</Badge>}
            <Badge>{CATEGORY_LABEL[event.category]}</Badge>
          </div>
          <h1>{event.title}</h1>
          <div className="row wrap" style={{ gap: 6 }}>
            {artists.map((a) => (
              <Link key={a.id} to={`/app/artista/${a.id}`} className="badge" style={{ background: 'rgba(11,11,18,.55)', color: '#fff' }}>
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      </EventCover>

      <div className="event-layout">
        <div className="event-main">
          <div className="card card-pad event-info">
            <div>
              <Calendar size={18} />
              <span>
                <b>{date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>
              </span>
            </div>
            <div>
              <Clock size={18} />
              <span>{fmtTime(event.date)}</span>
            </div>
            <div>
              <MapPin size={18} />
              <span>
                {venue?.name} · {city?.name}, {city?.state}
              </span>
            </div>
            <div>
              <Users size={18} />
              <span>{event.watchers.toLocaleString('pt-BR')} pessoas acompanhando</span>
            </div>
            {event.currentBatch && (
              <div>
                <Sparkles size={18} />
                <span>{event.currentBatch}</span>
              </div>
            )}
          </div>

          {status.showCountdown && event.salesStartAt && (
            <div className="card card-pad">
              <div className="label" style={{ marginBottom: 8 }}>
                {status.label} — {new Date(event.salesStartAt).toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </div>
              <Countdown to={event.salesStartAt} />
            </div>
          )}

          {reason && (
            <div className="reason card card-pad" style={{ fontSize: 14 }}>
              <Sparkles />
              <span>
                <b>Por que estou vendo isso?</b> {reason}
              </span>
            </div>
          )}

          <section className="card card-pad" id="precos">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Histórico de preços</h2>
                <p>Menor preço encontrado por setor, em todas as fontes monitoradas.</p>
              </div>
            </div>
            <div className="chips chips--scroll" style={{ marginBottom: 14 }}>
              {event.sectors.map((s) => (
                <button key={s.id} className={`chip${sectorId === s.id ? ' is-active' : ''}`} onClick={() => setSectorId(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
            <div className="stats">
              <div className="stat">
                <span>Preço atual</span>
                <b>{formatBRL(cheapestListing(world.listings, event.id, sectorId)?.price ?? null)}</b>
              </div>
              <div className="stat">
                <span>Menor monitorado</span>
                <b style={{ color: 'var(--green)' }}>{formatBRL(stats.lowest)}</b>
              </div>
              <div className="stat">
                <span>Maior monitorado</span>
                <b>{formatBRL(stats.highest)}</b>
              </div>
              <div className="stat">
                <span>Variação</span>
                <b>{stats.change != null && stats.change !== 0 ? <PriceDelta change={stats.change} /> : '—'}</b>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <PriceHistoryChart points={stats.points} target={target} />
            </div>
            {recentPoints.length > 0 && (
              <ul className="history-list" aria-label="Pontos do histórico">
                {recentPoints.map((p, i) => (
                  <li key={p.at + i}>
                    <span className="faint">{fmtDayMonth(p.at)}</span>
                    <b className="num">{formatBRL(p.price)}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card-pad" id="ingressos">
            <div className="section-head" style={{ marginBottom: 6 }}>
              <div>
                <h2>Ingressos por setor</h2>
                <p>O AVISÊ não vende ingressos: “Ver” leva você para a fonte.</p>
              </div>
            </div>
            <div className="sector-table">
              {event.sectors.map((s) => {
                const l = cheapestListing(world.listings, event.id, s.id);
                const src = l ? catalog.source(l.sourceId) : null;
                const offers = listings.filter((x) => x.sectorId === s.id).length;
                return (
                  <div className="sector-row" key={s.id}>
                    <div className="spacer">
                      <strong>{s.name}</strong>
                      <small className="faint">{l ? `${src?.name} · ${offers} ${offers === 1 ? 'oferta' : 'ofertas'}` : 'Sem ofertas agora'}</small>
                    </div>
                    <b className="num" style={{ fontSize: 17 }}>
                      {formatBRL(l?.price ?? null)}
                    </b>
                    {l ? (
                      <Link className="btn btn-primary btn-sm" to={`/app/ingresso/${encodeURIComponent(l.id)}`}>
                        Ver
                      </Link>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => requireAuth(() => setAlertOpen(true))}
                        aria-label={`Criar alerta para ${s.name}`}
                      >
                        <Bell size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card card-pad">
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Sobre o evento</h2>
            <p className="muted">{event.description}</p>
          </section>

          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 10 }}>
              <h2>Fontes monitoradas</h2>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {sourcesHere.length === 0 && <p className="muted">Nenhuma fonte com ofertas ainda. Assim que houver, começamos a acompanhar.</p>}
              {sourcesHere.map((s) => (
                <div className="row" key={s.id}>
                  <ShieldCheck size={18} color="var(--blue)" />
                  <span className="spacer">
                    {s.name} <span className="faint">· {s.kind === 'official' ? 'venda oficial' : 'revenda'}</span>
                  </span>
                  {s.isMock && <span className="demo-tag">Fictícia</span>}
                </div>
              ))}
            </div>
            <p className="hint" style={{ marginTop: 12 }}>
              Só monitoramos plataformas quando a coleta é técnica e legalmente permitida (API oficial, parceria ou feed autorizado).
            </p>
          </section>

          <section className="card card-pad">
            <div className="row">
              <Star size={18} color="var(--yellow)" />
              <h2 style={{ fontSize: 20 }}>Avaliações e fotos da comunidade</h2>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Em breve: notas de experiência, organização, estrutura e custo-benefício, além de fotos de quem foi.
            </p>
          </section>

          <DemoNotice />
        </div>

        <aside className="event-aside">
          <div className="card card-pad stack" style={{ gap: 12 }}>
            <div>
              <div className="faint" style={{ fontSize: 13 }}>
                {best ? 'Menor preço agora' : 'Preço'}
              </div>
              <div className="row" style={{ alignItems: 'baseline' }}>
                <span className="num" style={{ fontSize: 30 }}>
                  {best ? formatBRL(best.price) : '—'}
                </span>
                {best && <span className="faint">{event.sectors.find((s) => s.id === best.sectorId)?.name}</span>}
              </div>
              {radar?.maxPrice != null && (
                <div className="hint" style={{ marginTop: 4 }}>
                  🎯 Seu alvo: {formatBRL(radar.maxPrice)}
                </div>
              )}
            </div>
            <RadarButton event={event} block size="lg" />
            {best && (
              <Link className="btn btn-secondary btn-block" to={`/app/ingresso/${encodeURIComponent(best.id)}`}>
                <ExternalLink size={16} /> {status.cta === 'Ver detalhes' ? 'Ver ingressos' : status.cta}
              </Link>
            )}
            <button className="btn btn-secondary btn-block" onClick={() => requireAuth(() => setAlertOpen(true))}>
              <Bell size={16} /> Criar alerta de preço
            </button>
            {artists.map((a) => (
              <div className="row" key={a.id}>
                <span className="spacer" style={{ fontSize: 14 }}>
                  {a.name}
                </span>
                <FollowButton artist={a} />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="event-sticky">
        <div className="spacer">
          <div className="faint" style={{ fontSize: 12 }}>
            {best ? 'A partir de' : status.label}
          </div>
          <b className="num" style={{ fontSize: 18 }}>
            {best ? formatBRL(best.price) : '—'}
          </b>
        </div>
        <RadarButton event={event} short />
      </div>

      {alertOpen && (
        <PriceAlertModal event={event} onClose={() => setAlertOpen(false)} onSaved={() => toast({ icon: '🎯', title: 'Alerta de preço criado', text: `Vamos te avisar sobre ${event.title}.` })} />
      )}
    </div>
  );
}
