import { useNavigate } from 'react-router-dom';
import { Link } from '../lib/links';
import { formatBRL } from '../core/format';
import type { Notification } from '../core/types';
import { fmtRelative } from '../lib/dates';
import { ALERT_META } from '../lib/status';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';
import { PriceFlow } from './Price';

export function AlertCard({ n }: { n: Notification }) {
  const { world, store } = useApp();
  const navigate = useNavigate();
  const meta = ALERT_META[n.type];
  const ev = world.events.find((e) => e.id === n.eventId);
  const artist = ev ? { name: catalog.eventLabel(ev) } : n.artistId ? catalog.artist(n.artistId) : undefined;
  const sector = ev?.sectors.find((s) => s.id === n.sectorId)?.name;
  const listing = n.listingId ? world.listings.find((l) => l.id === n.listingId) : null;
  const hasPrices = n.data.from != null && n.data.to != null;
  const saving = hasPrices && n.data.to! < n.data.from! ? n.data.from! - n.data.to! : null;

  return (
    <article className={`card alert-card${n.read ? '' : ' is-unread'}`} onClick={() => !n.read && store.markRead(n.id)}>
      <div className={`alert-card__icon alert-card__icon--${meta.tone}`} aria-hidden>
        {meta.emoji}
      </div>
      <div className="alert-card__body">
        <div className="alert-card__title">{n.title}</div>
        <div className="alert-card__event">
          {artist?.name ?? ev?.title}
          {sector && hasPrices ? ` — ${sector}` : ev && artist && ev.title !== artist.name ? ` · ${catalog.city(ev.cityId)?.name}` : ''}
        </div>
        {hasPrices ? (
          <div style={{ marginTop: 8 }}>
            <PriceFlow from={n.data.from!} to={n.data.to!} />
            {saving != null && <div className="alert-card__saving">Você economiza {formatBRL(saving)}.</div>}
          </div>
        ) : (
          <p className="alert-card__text">{n.body}</p>
        )}
        <div className="alert-card__foot">
          {listing?.available ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                store.markRead(n.id);
                navigate(`/app/ingresso/${encodeURIComponent(listing.id)}?n=${n.id}`);
              }}
            >
              Ver ingresso
            </button>
          ) : null}
          {ev && (
            <Link className="btn btn-secondary btn-sm" to={`/app/evento/${ev.id}`} onClick={() => store.markRead(n.id)}>
              Ver evento
            </Link>
          )}
          <span className="alert-card__time">{fmtRelative(n.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
