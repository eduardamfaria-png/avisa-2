import { MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EventTile } from '../components/EventCard';
import { FollowButton } from '../components/FollowButton';
import { SearchBar } from '../components/SearchBar';
import { UserAvatar } from '../components/UserAvatar';
import { catalog } from '../services/catalog';
import { CATEGORY_LABEL, search } from '../services/search';
import { useApp } from '../state/hooks';

const SUGGESTIONS = ['BTS', 'Sertanejo', 'Rio de Janeiro', 'Festival', 'São Paulo', 'Stand-up'];

export function Busca() {
  const { world } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const r = search(q, world.events);
  const total = r.artists.length + r.events.length + r.venues.length;

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <h1>Buscar</h1>
      </div>
      <SearchBar size="lg" autoFocus={!q} />

      {!q ? (
        <section className="section">
          <div className="section-head">
            <h2>Sugestões</h2>
          </div>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => setParams({ q: s })}>
                {s}
              </button>
            ))}
          </div>
        </section>
      ) : total === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>Nada encontrado para “{q}”</h3>
          <p>Tente buscar por artista, evento, festival, local, cidade ou categoria.</p>
        </div>
      ) : (
        <>
          {r.categories.length > 0 && (
            <div className="row wrap" style={{ marginTop: 16 }}>
              <span className="faint" style={{ fontSize: 13 }}>
                Categoria:
              </span>
              {r.categories.map((c) => (
                <span key={c} className="badge badge--blue">
                  {CATEGORY_LABEL[c]}
                </span>
              ))}
            </div>
          )}
          {r.artists.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Artistas</h2>
              </div>
              <div className="card">
                {r.artists.map((a) => (
                  <div className="list-item" key={a.id}>
                    <Link to={`/app/artista/${a.id}`}>
                      <UserAvatar name={a.name} hue={a.hue} size={48} />
                    </Link>
                    <Link to={`/app/artista/${a.id}`} className="list-item__main">
                      <strong>{a.name}</strong>
                      <small>
                        {a.genre} · {world.events.filter((e) => e.artistIds.includes(a.id)).length} eventos
                      </small>
                    </Link>
                    <FollowButton artist={a} />
                  </div>
                ))}
              </div>
            </section>
          )}
          {r.events.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Eventos</h2>
                <span className="faint" style={{ fontSize: 13 }}>
                  {r.events.length}
                </span>
              </div>
              <div className="grid grid--3">
                {r.events.map((e) => (
                  <EventTile key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
          {r.venues.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Locais</h2>
              </div>
              <div className="card">
                {r.venues.map((v) => (
                  <div className="list-item" key={v.id}>
                    <span className="thumb" style={{ display: 'grid', placeItems: 'center', background: 'var(--card-2)' }}>
                      <MapPin size={20} color="var(--blue)" />
                    </span>
                    <div className="list-item__main">
                      <strong>{v.name}</strong>
                      <small>
                        {catalog.cityName(v.cityId)} · {world.events.filter((e) => e.venueId === v.id).length} eventos
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
