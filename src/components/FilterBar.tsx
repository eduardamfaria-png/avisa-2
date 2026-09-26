import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { EventCategory, EventStatus } from '../core/types';
import { catalog } from '../services/catalog';
import { CATEGORY_LABEL } from '../services/search';
import { useMediaQuery } from '../state/hooks';
import { Modal } from './Modal';

export interface Filters {
  cityId: string;
  period: 'all' | 'week' | 'month' | '3months';
  category: '' | EventCategory;
  maxPrice: number | null;
  distanceKm: number | null;
  status: '' | EventStatus;
}

export const EMPTY_FILTERS: Filters = { cityId: '', period: 'all', category: '', maxPrice: null, distanceKm: null, status: '' };

const PERIODS: [Filters['period'], string][] = [
  ['all', 'Qualquer data'],
  ['week', 'Próximos 7 dias'],
  ['month', 'Próximos 30 dias'],
  ['3months', 'Próximos 3 meses'],
];
const STATUSES: [EventStatus, string][] = [
  ['on_sale', 'Vendas abertas'],
  ['presale', 'Venda futura'],
  ['announced', 'Anunciado'],
  ['resale', 'Revenda'],
  ['sold_out', 'Esgotado'],
];
const PRICES = [150, 300, 500, 1000, 2000];
const DISTANCES = [50, 150, 500, 1000];

export function activeCount(f: Filters) {
  return [f.cityId, f.period !== 'all', f.category, f.maxPrice, f.distanceKm, f.status].filter(Boolean).length;
}

function Fields({ f, set, hasHome }: { f: Filters; set: (f: Filters) => void; hasHome: boolean }) {
  return (
    <>
      <label className="field">
        <span>Localização</span>
        <select className="select" value={f.cityId} onChange={(e) => set({ ...f, cityId: e.target.value })}>
          <option value="">Todas as cidades</option>
          {catalog.cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Data</span>
        <select className="select" value={f.period} onChange={(e) => set({ ...f, period: e.target.value as Filters['period'] })}>
          {PERIODS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Categoria</span>
        <select className="select" value={f.category} onChange={(e) => set({ ...f, category: e.target.value as Filters['category'] })}>
          <option value="">Todas</option>
          {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Preço</span>
        <select className="select" value={f.maxPrice ?? ''} onChange={(e) => set({ ...f, maxPrice: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Qualquer preço</option>
          {PRICES.map((p) => (
            <option key={p} value={p}>
              Até R$ {p.toLocaleString('pt-BR')}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Distância</span>
        <select className="select" value={f.distanceKm ?? ''} disabled={!hasHome} onChange={(e) => set({ ...f, distanceKm: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{hasHome ? 'Qualquer distância' : 'Defina sua cidade no perfil'}</option>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>
              Até {d} km
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select className="select" value={f.status} onChange={(e) => set({ ...f, status: e.target.value as Filters['status'] })}>
          <option value="">Todos</option>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function FilterBar({ value, onChange, hasHome }: { value: Filters; onChange: (f: Filters) => void; hasHome: boolean }) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const n = activeCount(value);

  if (desktop)
    return (
      <div className="filterbar">
        <Fields f={value} set={onChange} hasHome={hasHome} />
        {n > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => onChange(EMPTY_FILTERS)} style={{ alignSelf: 'flex-end', marginBottom: 6 }}>
            Limpar
          </button>
        )}
      </div>
    );

  return (
    <>
      <button
        className={`chip${n ? ' is-active' : ''}`}
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
      >
        <SlidersHorizontal size={16} /> Filtros{n ? ` (${n})` : ''}
      </button>
      {open && (
        <Modal
          title="Filtros"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDraft(EMPTY_FILTERS)}>
                Limpar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Aplicar
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            <Fields f={draft} set={setDraft} hasHome={hasHome} />
          </div>
        </Modal>
      )}
    </>
  );
}
