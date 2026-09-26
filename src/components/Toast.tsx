import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../core/types';
import { catalog } from '../services/catalog';
import { store } from '../state/store';
import { ALERT_META } from '../lib/status';
import { PriceFlow } from './Price';
import { formatBRL } from '../core/format';

interface ToastItem {
  id: number;
  icon: string;
  title: string;
  text?: ReactNode;
  action?: { label: string; onClick: () => void };
}

const ToastCtx = createContext<(t: Omit<ToastItem, 'id'>) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

let n = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const navigate = useNavigate();
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = ++n;
      setItems((xs) => [...xs.slice(-2), { ...t, id }]);
      timers.current.set(id, setTimeout(() => dismiss(id), 6500));
    },
    [dismiss],
  );

  // Alertas gerados pelo monitoramento aparecem como toast.
  useEffect(
    () =>
      store.onNotifications((ns: Notification[]) => {
        const sorted = [...ns].sort((a, b) => (a.importance === b.importance ? 0 : a.importance === 'high' ? -1 : 1));
        sorted.slice(0, 2).forEach((nt) => {
          const ev = store.getSnapshot().world.events.find((e) => e.id === nt.eventId);
          const artist = ev ? catalog.eventLabel(ev) : '';
          const sector = ev?.sectors.find((s) => s.id === nt.sectorId)?.name;
          push({
            icon: ALERT_META[nt.type].emoji,
            title: nt.title,
            text:
              nt.data.from != null && nt.data.to != null ? (
                <>
                  {artist}
                  {sector ? ` — ${sector}` : ''}
                  <br />
                  <PriceFlow from={nt.data.from} to={nt.data.to} />
                  {nt.data.to < nt.data.from && <> · economize {formatBRL(nt.data.difference!)}</>}
                </>
              ) : (
                <>
                  {ev?.title}
                  <br />
                  {nt.body}
                </>
              ),
            action: nt.listingId
              ? { label: 'Ver ingresso', onClick: () => navigate(`/app/ingresso/${encodeURIComponent(nt.listingId!)}?n=${nt.id}`) }
              : nt.eventId
                ? { label: 'Ver evento', onClick: () => navigate(`/app/evento/${nt.eventId}`) }
                : undefined,
          });
        });
        if (ns.length > 2) push({ icon: '🔔', title: `+${ns.length - 2} alertas`, text: 'Veja todos na aba Alertas.', action: { label: 'Abrir alertas', onClick: () => navigate('/app/alertas') } });
      }),
    [push, navigate],
  );

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div className="toast" key={t.id} role="status">
            <div className="toast__icon">{t.icon}</div>
            <div className="toast__body">
              <strong>{t.title}</strong>
              {t.text && <p>{t.text}</p>}
              <div className="toast__actions">
                {t.action && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => dismiss(t.id)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
