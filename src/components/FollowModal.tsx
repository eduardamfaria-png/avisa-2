import { useState } from 'react';
import { describeScope, SCOPE_LABEL } from '../core/location';
import type { Artist, LocationScope } from '../core/types';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';
import { Modal } from './Modal';

const SCOPES: { id: LocationScope; hint: string }[] = [
  { id: 'my_city', hint: 'Só shows na cidade onde você mora' },
  { id: 'radius', hint: 'Sua cidade e cidades próximas' },
  { id: 'cities', hint: 'Escolha as cidades' },
  { id: 'brazil', hint: 'Qualquer show no país' },
  { id: 'international', hint: 'Brasil e exterior' },
];

export function ScopePicker({
  value,
  onChange,
}: {
  value: { scope: LocationScope; radiusKm: number; cityIds: string[]; homeCityId: string | null };
  onChange: (v: { scope: LocationScope; radiusKm: number; cityIds: string[]; homeCityId: string | null }) => void;
}) {
  const needsHome = value.scope === 'my_city' || value.scope === 'radius';
  return (
    <div className="stack">
      {SCOPES.map((s) => (
        <button key={s.id} type="button" className={`option${value.scope === s.id ? ' is-active' : ''}`} onClick={() => onChange({ ...value, scope: s.id })}>
          <span className="option__radio" />
          <span>
            <strong>{s.id === 'radius' ? `Até ${value.radiusKm} km` : SCOPE_LABEL[s.id]}</strong>
            <small>{s.hint}</small>
          </span>
        </button>
      ))}
      {needsHome && (
        <label className="field">
          <span>Sua cidade</span>
          <select className="select" value={value.homeCityId ?? ''} onChange={(e) => onChange({ ...value, homeCityId: e.target.value || null })}>
            <option value="">Selecione…</option>
            {catalog.cities.filter((c) => c.country === 'BR').map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.state}
              </option>
            ))}
          </select>
        </label>
      )}
      {value.scope === 'radius' && (
        <label className="field">
          <span>Distância máxima: {value.radiusKm} km</span>
          <input type="range" min={25} max={800} step={25} value={value.radiusKm} onChange={(e) => onChange({ ...value, radiusKm: Number(e.target.value) })} />
        </label>
      )}
      {value.scope === 'cities' && (
        <div className="chips">
          {catalog.cities.map((c) => {
            const on = value.cityIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip${on ? ' is-active' : ''}`}
                onClick={() => onChange({ ...value, cityIds: on ? value.cityIds.filter((x) => x !== c.id) : [...value.cityIds, c.id] })}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FollowModal({ artist, onClose, onSaved }: { artist: Artist; onClose: () => void; onSaved?: (summary: string) => void }) {
  const { data, store } = useApp();
  const existing = data?.artistPrefs.find((p) => p.artistId === artist.id);
  const [v, setV] = useState({
    scope: existing?.scope ?? (data?.prefs.travel === 'international' ? 'international' : data?.prefs.travel === 'brazil' ? 'brazil' : 'radius') as LocationScope,
    radiusKm: existing?.radiusKm ?? 150,
    cityIds: existing?.cityIds ?? [],
    homeCityId: data?.prefs.homeCityId ?? null,
  });
  const invalid = ((v.scope === 'my_city' || v.scope === 'radius') && !v.homeCityId) || (v.scope === 'cities' && v.cityIds.length === 0);

  const save = () => {
    if (v.homeCityId !== data?.prefs.homeCityId) store.updatePrefs({ homeCityId: v.homeCityId });
    store.followArtist({ artistId: artist.id, scope: v.scope, radiusKm: v.radiusKm, cityIds: v.cityIds });
    onSaved?.(describeScope(v, catalog.cityName, catalog.city(v.homeCityId)?.name));
    onClose();
  };

  return (
    <Modal
      title={`Onde você gostaria de acompanhar ${artist.name}?`}
      subtitle="Essa configuração vale só para este artista. Você pode mudar quando quiser."
      onClose={onClose}
      footer={
        <>
          {existing && (
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                store.unfollowArtist(artist.id);
                onClose();
              }}
            >
              Deixar de seguir
            </button>
          )}
          <button className="btn btn-primary" disabled={invalid} onClick={save}>
            {existing ? 'Salvar' : 'Seguir artista'}
          </button>
        </>
      }
    >
      <ScopePicker value={v} onChange={setV} />
    </Modal>
  );
}
