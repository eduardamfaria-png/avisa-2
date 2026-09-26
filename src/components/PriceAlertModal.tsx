import { useState } from 'react';
import { formatBRL } from '../core/format';
import { cheapestListing } from '../core/market';
import type { Event } from '../core/types';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';
import { Modal } from './Modal';

/** "Criar alerta de preço": evento, setor, preço máximo e fonte. */
export function PriceAlertModal({ event: fixed, onClose, onSaved }: { event?: Event; onClose: () => void; onSaved?: () => void }) {
  const { world, store } = useApp();
  const upcoming = world.events.filter((e) => e.status !== 'announced').sort((a, b) => a.title.localeCompare(b.title));
  const [eventId, setEventId] = useState(fixed?.id ?? upcoming[0]?.id ?? '');
  const [sectorId, setSectorId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [max, setMax] = useState('');
  const [error, setError] = useState('');
  const event = world.events.find((e) => e.id === eventId);
  const current = event ? cheapestListing(world.listings, event.id, sectorId || null, sourceId || null)?.price ?? null : null;
  const artistName = event ? catalog.eventLabel(event) : '';

  const save = () => {
    const value = Number(max);
    if (!event) return setError('Escolha um evento.');
    if (!value || value <= 0) return setError('Informe o preço máximo.');
    try {
      store.addRule({ eventId: event.id, sectorId: sectorId || null, sourceId: sourceId || null, maxPrice: value });
      onSaved?.();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      title="Criar alerta de preço"
      subtitle={max && event ? `Me avise quando encontrar ${artistName} por menos de ${formatBRL(Number(max))}.` : 'Defina quanto você topa pagar. A gente avisa quando aparecer.'}
      onClose={onClose}
      footer={
        <button className="btn btn-primary" onClick={save}>
          Criar alerta
        </button>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {!fixed && (
          <label className="field">
            <span>Evento</span>
            <select className="select" value={eventId} onChange={(e) => (setEventId(e.target.value), setSectorId(''))}>
              {upcoming.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Setor</span>
          <select className="select" value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
            <option value="">Qualquer setor</option>
            {event?.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Preço máximo</span>
          <div className="input-prefix">
            <span>R$</span>
            <input className="input" autoFocus inputMode="numeric" placeholder="1.500" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
          </div>
          <span className="hint">
            {current != null ? `Menor preço agora: ${formatBRL(current)}` : 'Sem ofertas no momento — vamos avisar quando surgir.'}
            {current != null && max && current <= Number(max) ? ' — já está abaixo! Você será avisado no próximo ciclo.' : ''}
          </span>
        </label>
        <label className="field">
          <span>Fonte / plataforma</span>
          <select className="select" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Qualquer fonte monitorada</option>
            {catalog.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
      </div>
    </Modal>
  );
}
