import { Bell, Compass, Plus, Radar } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from '../lib/links';
import { DemoNotice } from '../components/DemoNotice';
import { EventCard, EventTile } from '../components/EventCard';
import { FollowModal } from '../components/FollowModal';
import { PriceFlow } from '../components/Price';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { SimulationPanel } from '../components/SimulationPanel';
import { useToast } from '../components/Toast';
import { UserAvatar } from '../components/UserAvatar';
import { formatBRL } from '../core/format';
import { describeScope } from '../core/location';
import type { Artist } from '../core/types';
import { ALERT_META } from '../lib/status';
import { catalog } from '../services/catalog';
import { forYou, isUpcoming } from '../services/recommendations';
import { useApp } from '../state/hooks';

const PRIORITY = { alta: 0, normal: 1, baixa: 2 };

export function MeuAvise() {
  const { world, data, user } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [alertOpen, setAlertOpen] = useState(false);
  const [editArtist, setEditArtist] = useState<Artist | null>(null);
  if (!data || !user) return null;

  const items = data.radar
    .map((r) => ({ r, ev: world.events.find((e) => e.id === r.eventId) }))
    .filter((x): x is { r: typeof x.r; ev: NonNullable<typeof x.ev> } => !!x.ev)
    .sort((a, b) => PRIORITY[a.r.priority] - PRIORITY[b.r.priority] || a.ev.date.localeCompare(b.ev.date));

  const radarEventIds = new Set(items.map((x) => x.ev.id));
  const unread = data.notifications.filter((n) => !n.read);
  const highlight = unread.find((n) => n.type === 'target_reached' || n.type === 'price_drop' || n.type === 'new_lowest');
  const hlEvent = highlight ? world.events.find((e) => e.id === highlight.eventId) : undefined;
  const suggestions = forYou(world, data).slice(0, 3);
  const home = catalog.city(data.prefs.homeCityId)?.name;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Meu Avisê</h1>
          <p>Tudo que você quer acompanhar, em um só lugar.</p>
        </div>
        <div className="row">
          <button className="btn btn-secondary" onClick={() => setAlertOpen(true)}>
            <Bell size={17} /> Criar alerta de preço
          </button>
        </div>
      </div>

      <div className="summary">
        <div>
          <b className="num">{items.length}</b>
          <span>no Radar</span>
        </div>
        <div>
          <b className="num">{data.artistPrefs.length}</b>
          <span>artistas</span>
        </div>
        <Link to="/app/alertas">
          <b className="num" style={unread.length ? { color: 'var(--purple)' } : undefined}>
            {unread.length}
          </b>
          <span>alertas novos</span>
        </Link>
      </div>

      {highlight && hlEvent && (
        <Link to={highlight.listingId ? `/app/ingresso/${encodeURIComponent(highlight.listingId)}?n=${highlight.id}` : `/app/evento/${hlEvent.id}`} className="card highlight">
          <span className="highlight__emoji">{ALERT_META[highlight.type].emoji}</span>
          <span className="spacer">
            <strong>{highlight.title}</strong>
            <span className="muted" style={{ display: 'block', fontSize: 14 }}>
              {catalog.eventLabel(hlEvent)}
              {highlight.sectorId ? ` — ${hlEvent.sectors.find((s) => s.id === highlight.sectorId)?.name}` : ''}
            </span>
            {highlight.data.from != null && highlight.data.to != null ? (
              <span style={{ display: 'block', marginTop: 6 }}>
                <PriceFlow from={highlight.data.from} to={highlight.data.to} />
                {highlight.data.to < highlight.data.from && <span style={{ color: 'var(--green)', fontWeight: 600, marginLeft: 8 }}>Você economiza {formatBRL(highlight.data.from - highlight.data.to)}</span>}
              </span>
            ) : (
              <span style={{ display: 'block', marginTop: 4, fontSize: 14 }}>{highlight.body}</span>
            )}
          </span>
          <span className="btn btn-primary btn-sm">{highlight.listingId ? 'Ver ingresso' : 'Ver evento'}</span>
        </Link>
      )}

      <div className="section" style={{ marginTop: 20 }}>
        <SimulationPanel />
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>No seu Radar</h2>
            <p>Eventos que o AVISÊ está vigiando para você.</p>
          </div>
          <Link to="/app/explorar">+ Adicionar</Link>
        </div>
        {items.length === 0 ? (
          <div className="empty">
            <Radar size={36} color="var(--purple)" />
            <h3>Seu Radar está vazio</h3>
            <p>Adicione um show ou festival e defina quanto quer pagar. A gente fica de olho e te avisa quando algo mudar.</p>
            <button className="btn btn-primary" onClick={() => navigate('/app/explorar')}>
              <Compass size={17} /> Explorar eventos
            </button>
          </div>
        ) : (
          <div className="grid grid--3">
            {items.map(({ r, ev }) => (
              <EventCard key={ev.id} event={ev} radar={r} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Artistas que você acompanha</h2>
            <p>Avisamos quando surgirem novas datas na área que você escolheu.</p>
          </div>
          <Link to="/app/explorar">Seguir mais</Link>
        </div>
        {data.artistPrefs.length === 0 ? (
          <p className="muted">Você ainda não segue nenhum artista.</p>
        ) : (
          <div className="card">
            {data.artistPrefs.map((p) => {
              const a = catalog.artist(p.artistId);
              if (!a) return null;
              const upcoming = world.events.filter((e) => e.artistIds.includes(a.id) && isUpcoming(e));
              const notInRadar = upcoming.filter((e) => !radarEventIds.has(e.id));
              return (
                <div className="list-item" key={a.id}>
                  <Link to={`/app/artista/${a.id}`}>
                    <UserAvatar name={a.name} hue={a.hue} size={46} />
                  </Link>
                  <div className="list-item__main">
                    <Link to={`/app/artista/${a.id}`}>
                      <strong>{a.name}</strong>
                    </Link>
                    <small>
                      📍 {describeScope(p, catalog.cityName, home)} ·{' '}
                      {upcoming.length === 0 ? (
                        <span>Evento ainda não anunciado. Estamos acompanhando.</span>
                      ) : notInRadar.length ? (
                        <Link className="link" to={`/app/artista/${a.id}`} style={{ fontSize: 13 }}>
                          {notInRadar.length} {notInRadar.length === 1 ? 'show anunciado' : 'shows anunciados'}
                        </Link>
                      ) : (
                        <span>Todas as datas estão no seu Radar</span>
                      )}
                    </small>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditArtist(a)}>
                    Editar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>Talvez você queira acompanhar</h2>
              <p>Com base em quem você segue e onde costuma ir.</p>
            </div>
            <Link to="/app/explorar">Ver mais</Link>
          </div>
          <div className="grid grid--3">
            {suggestions.map((s) => (
              <EventTile key={s.event.id} event={s.event} reason={s.reason} />
            ))}
          </div>
        </section>
      )}

      <div className="section">
        <DemoNotice />
      </div>

      <button className="fab" aria-label="Criar alerta de preço" onClick={() => setAlertOpen(true)}>
        <Plus size={24} />
      </button>

      {alertOpen && (
        <PriceAlertModal onClose={() => setAlertOpen(false)} onSaved={() => toast({ icon: '🎯', title: 'Alerta de preço criado', text: 'Vamos avisar assim que o preço chegar lá.' })} />
      )}
      {editArtist && <FollowModal artist={editArtist} onClose={() => setEditArtist(null)} />}
    </>
  );
}
