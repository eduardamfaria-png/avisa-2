import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from '../lib/links';
import { fmtRelative } from '../lib/dates';
import { ALERT_META } from '../lib/status';
import { catalog } from '../services/catalog';
import { useApp, useMediaQuery } from '../state/hooks';

/** Sino com contador; no desktop abre um painel, no celular leva para Alertas. */
export function NotificationCenter() {
  const { data, world, store } = useApp();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!data) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" aria-label={`Alertas${unread ? ` (${unread} não lidos)` : ''}`} onClick={() => (desktop ? setOpen(!open) : navigate('/app/alertas'))}>
        <Bell size={21} />
        {unread > 0 && <span className="nav-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="nc">
          <div className="nc__head">
            <strong>Alertas</strong>
            {unread > 0 && (
              <button className="link" onClick={() => store.markAllRead()}>
                Marcar como lidos
              </button>
            )}
          </div>
          {data.notifications.length === 0 && <p className="muted" style={{ padding: 16 }}>Nenhum alerta por enquanto. Estamos de olho.</p>}
          {data.notifications.slice(0, 8).map((n) => {
            const ev = world.events.find((e) => e.id === n.eventId);
            return (
              <button
                key={n.id}
                className="nc__item"
                onClick={() => {
                  store.markRead(n.id);
                  setOpen(false);
                  navigate(ev ? `/app/evento/${ev.id}` : '/app/alertas');
                }}
              >
                <span className={`alert-card__icon alert-card__icon--${ALERT_META[n.type].tone}`}>{ALERT_META[n.type].emoji}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>
                    {n.title} {!n.read && <span style={{ color: 'var(--purple)' }}>•</span>}
                  </strong>
                  <p>
                    {ev ? `${catalog.eventLabel(ev)} · ` : ''}
                    {n.body}
                  </p>
                  <small className="faint">{fmtRelative(n.createdAt)}</small>
                </span>
              </button>
            );
          })}
          <Link to="/app/alertas" className="nc__item link" style={{ justifyContent: 'center' }} onClick={() => setOpen(false)}>
            Ver todos os alertas
          </Link>
        </div>
      )}
    </div>
  );
}
