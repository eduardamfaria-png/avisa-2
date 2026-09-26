import { useState } from 'react';
import { describeScope } from '../core/location';
import { formatBRL } from '../core/format';
import { cheapestListing } from '../core/market';
import type { Event, RadarPriority } from '../core/types';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';
import { ActionError } from '../state/store';
import { Modal } from './Modal';

/** Configuração individual de um evento no Radar: setor, preço máximo, prioridade, alertas e localização. */
export function RadarModal({ event, onClose, onSaved }: { event: Event; onClose: () => void; onSaved?: (isNew: boolean) => void }) {
  const { world, data, store } = useApp();
  const existing = data?.radar.find((r) => r.eventId === event.id);
  const artist = catalog.mainArtist(event);
  const artistPref = artist ? data?.artistPrefs.find((p) => p.artistId === artist.id) : undefined;

  const [sectorId, setSectorId] = useState<string>(existing?.sectorId ?? '');
  const [maxPrice, setMaxPrice] = useState<string>(existing?.maxPrice != null ? String(existing.maxPrice) : '');
  const [priority, setPriority] = useState<RadarPriority>(existing?.priority ?? 'normal');
  const [alerts, setAlerts] = useState(existing?.alertsEnabled ?? true);
  const [follow, setFollow] = useState(!!artistPref || !existing);
  const [error, setError] = useState('');

  const current = cheapestListing(world.listings, event.id, sectorId || null)?.price ?? null;
  const target = maxPrice ? Number(maxPrice) : null;
  const city = catalog.city(event.cityId);

  const save = () => {
    try {
      if (target != null && (!Number.isFinite(target) || target <= 0)) throw new ActionError('Informe um preço máximo válido.');
      store.upsertRadar({ eventId: event.id, sectorId: sectorId || null, maxPrice: target, priority, alertsEnabled: alerts });
      if (artist && follow && !artistPref) store.followArtist({ artistId: artist.id, scope: 'brazil', radiusKm: 150, cityIds: [] });
      onSaved?.(!existing);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      title={existing ? 'Configurar no Meu Avisê' : 'Adicionar ao Meu Avisê'}
      subtitle={`${event.title} · ${city?.name}`}
      onClose={onClose}
      footer={
        <>
          {existing && (
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                store.removeRadar(event.id);
                onClose();
              }}
            >
              Remover
            </button>
          )}
          <button className="btn btn-primary" onClick={save}>
            {existing ? 'Salvar' : 'Adicionar ao Radar'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        <label className="field">
          <span>Setor</span>
          <select className="select" value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
            <option value="">Qualquer setor</option>
            {event.sectors.map((s) => {
              const p = cheapestListing(world.listings, event.id, s.id)?.price;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} {p != null ? `— a partir de ${formatBRL(p)}` : '— sem ofertas agora'}
                </option>
              );
            })}
          </select>
        </label>

        <label className="field">
          <span>Preço máximo (opcional)</span>
          <div className="input-prefix">
            <span>R$</span>
            <input className="input" inputMode="numeric" placeholder="1.500" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} />
          </div>
          <span className="hint">
            {target != null && current != null && current <= target
              ? `Já existe oferta por ${formatBRL(current)} — abaixo do seu limite. Você será avisado no próximo ciclo.`
              : target != null
                ? `Vamos avisar quando encontrarmos por ${formatBRL(target)} ou menos${current != null ? ` (hoje: ${formatBRL(current)})` : ''}.`
                : 'Defina um valor para receber o alerta "Preço atingido!".'}
          </span>
        </label>

        <div className="field">
          <span className="label">Prioridade</span>
          <div className="seg">
            {(['alta', 'normal', 'baixa'] as RadarPriority[]).map((p) => (
              <button key={p} type="button" className={priority === p ? 'is-active' : ''} onClick={() => setPriority(p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="row" onClick={() => setAlerts(!alerts)} style={{ textAlign: 'left' }}>
          <span className="spacer">
            <strong style={{ display: 'block', fontWeight: 600 }}>Alertas deste evento</strong>
            <small className="muted">Preço, lote, esgotamento e revenda</small>
          </span>
          <span className={`switch${alerts ? ' is-on' : ''}`} role="switch" aria-checked={alerts} />
        </button>

        {artist && (
          <div className="card card-pad" style={{ background: 'var(--bg-2)' }}>
            <strong style={{ fontWeight: 600 }}>Localização</strong>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Este evento é em {city?.name}.{' '}
              {artistPref
                ? `Novas datas de ${artist.name}: ${describeScope(artistPref, catalog.cityName, catalog.city(data?.prefs.homeCityId)?.name)} (ajuste na página do artista).`
                : `Quer saber de outras datas de ${artist.name}?`}
            </p>
            {!artistPref && (
              <button type="button" className="row" style={{ marginTop: 10, textAlign: 'left' }} onClick={() => setFollow(!follow)}>
                <span className="spacer" style={{ fontSize: 14 }}>
                  Seguir {artist.name} (Brasil inteiro)
                </span>
                <span className={`switch${follow ? ' is-on' : ''}`} role="switch" aria-checked={follow} />
              </button>
            )}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
      </div>
    </Modal>
  );
}
