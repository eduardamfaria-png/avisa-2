import { useState } from 'react';
import { ArtistCard } from '../components/ArtistCard';
import { EventTile } from '../components/EventCard';
import { EMPTY_FILTERS, FilterBar, activeCount, type Filters } from '../components/FilterBar';
import { PriceDropCard } from '../components/PriceDropCard';
import { SearchBar } from '../components/SearchBar';
import type { EventCategory } from '../core/types';
import { catalog } from '../services/catalog';
import { applyFilters } from '../services/filters';
import { forYou, opportunities, trending } from '../services/recommendations';
import { CATEGORY_LABEL } from '../services/search';
import { useApp } from '../state/hooks';

export function Explorar() {
  const { world, data, store } = useApp();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const home = catalog.city(data?.prefs.homeCityId) ?? null;
  const filtering = activeCount(filters) > 0;
  const results = applyFilters(world.events, filters, world.listings, home);
  const recs = forYou(world, data).slice(0, 8);
  const hot = trending(world).slice(0, 8);
  const opps = opportunities(world).slice(0, 6);
  const followed = new Set(data?.artistPrefs.map((p) => p.artistId));
  const artists = [...catalog.artists].sort((a, b) => Number(followed.has(a.id)) - Number(followed.has(b.id)) || b.followers - a.followers);

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <h1>Explorar</h1>
          <p>O que você está procurando?</p>
        </div>
      </div>
      <SearchBar size="lg" />

      <div className="explore-filters">
        <div className="chips chips--scroll">
          <FilterBarMobileSlot filters={filters} setFilters={setFilters} hasHome={!!home} />
          {(Object.keys(CATEGORY_LABEL) as EventCategory[])
            .filter((c) => world.events.some((e) => e.category === c))
            .map((c) => (
              <button key={c} className={`chip${filters.category === c ? ' is-active' : ''}`} onClick={() => setFilters({ ...filters, category: filters.category === c ? '' : c })}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          <button className={`chip${filters.period === 'month' ? ' is-active' : ''}`} onClick={() => setFilters({ ...filters, period: filters.period === 'month' ? 'all' : 'month' })}>
            Próximos 30 dias
          </button>
          {home && (
            <button className={`chip${filters.cityId === home.id ? ' is-active' : ''}`} onClick={() => setFilters({ ...filters, cityId: filters.cityId === home.id ? '' : home.id })}>
              📍 {home.name}
            </button>
          )}
        </div>
        <div className="desktop-only">
          <FilterBar value={filters} onChange={setFilters} hasHome={!!home} />
        </div>
      </div>

      {filtering ? (
        <section className="section">
          <div className="section-head">
            <h2>
              {results.length} {results.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
            </h2>
            <button className="link" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpar filtros
            </button>
          </div>
          {results.length ? (
            <div className="grid grid--3">
              {results.map((e) => (
                <EventTile key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>Nada por aqui com esses filtros</h3>
              <p>Tente ampliar a data, a distância ou o preço.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {recs.length > 0 && (
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Para você</h2>
                  <p>Cada sugestão mostra por que você está vendo isso.</p>
                </div>
              </div>
              <div className="rail">
                {recs.map((r) => (
                  <EventTile key={r.event.id} event={r.event} reason={r.reason} onIgnore={() => store.ignoreEvent(r.event.id)} />
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Artistas para acompanhar</h2>
                <p>Nomes usados apenas como exemplo nesta demonstração.</p>
              </div>
            </div>
            <div className="rail rail--artists">
              {artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Últimas oportunidades</h2>
                <p>Quedas de preço, novos menores preços, revendas e últimos ingressos.</p>
              </div>
            </div>
            {opps.length ? (
              <div className="grid grid--2">
                {opps.map((o) => (
                  <PriceDropCard key={o.event.id} o={o} />
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma oportunidade agora. Rode um ciclo de monitoramento para ver mudanças.</p>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Em alta</h2>
                <p>Eventos com mais gente acompanhando no AVISÊ.</p>
              </div>
            </div>
            <div className="rail">
              {hot.map((e) => (
                <EventTile key={e.id} event={e} />
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Todos os eventos</h2>
            </div>
            <div className="grid grid--3">
              {results.map((e) => (
                <EventTile key={e.id} event={e} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function FilterBarMobileSlot({ filters, setFilters, hasHome }: { filters: Filters; setFilters: (f: Filters) => void; hasHome: boolean }) {
  return (
    <span className="mobile-only">
      <FilterBar value={filters} onChange={setFilters} hasHome={hasHome} />
    </span>
  );
}
