import { LogOut, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FollowModal } from '../components/FollowModal';
import { UserAvatar } from '../components/UserAvatar';
import { describeScope } from '../core/location';
import { PLANS } from '../core/plans';
import type { Artist, BudgetRange, TravelPreference } from '../core/types';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';

const TRAVEL: [TravelPreference, string][] = [
  ['near', 'Somente perto'],
  ['other_cities', 'Outras cidades'],
  ['brazil', 'Brasil inteiro'],
  ['international', 'Internacional'],
];
const BUDGET: [BudgetRange, string][] = [
  ['ate_150', 'Até R$ 150'],
  ['150_400', 'R$ 150–400'],
  ['400_1000', 'R$ 400–1.000'],
  ['acima_1000', 'Acima de R$ 1.000'],
];

export function Perfil() {
  const { user, data, world, store } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [artist, setArtist] = useState<Artist | null>(null);
  if (!user || !data) return null;
  const home = catalog.city(data.prefs.homeCityId);
  const plan = PLANS[user.plan];

  return (
    <>
      <div className="card card-pad profile-head">
        <UserAvatar name={user.name} size={76} hue={262} />
        <div className="spacer">
          {editing ? (
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) store.updateUser({ name: name.trim() });
                setEditing(false);
              }}
            >
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <button className="btn btn-primary btn-sm">Salvar</button>
            </form>
          ) : (
            <h1 style={{ fontSize: 26 }}>
              {user.name}{' '}
              <button className="icon-btn" aria-label="Editar nome" onClick={() => setEditing(true)} style={{ verticalAlign: 'middle' }}>
                <Pencil size={16} />
              </button>
            </h1>
          )}
          <p className="muted">
            @{user.username} {home && `· ${home.name}`}
          </p>
        </div>
      </div>

      <div className="summary" style={{ marginTop: 14 }}>
        <div>
          <b className="num">{data.radar.length}</b>
          <span>no Radar</span>
        </div>
        <div>
          <b className="num">{data.artistPrefs.length}</b>
          <span>artistas</span>
        </div>
        <div>
          <b className="num">{data.notifications.length}</b>
          <span>alertas</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Preferências</h2>
        </div>
        <div className="card card-pad stack" style={{ gap: 18 }}>
          <label className="field">
            <span>Cidade principal</span>
            <select className="select" value={data.prefs.homeCityId ?? ''} onChange={(e) => store.updatePrefs({ homeCityId: e.target.value || null })}>
              <option value="">Não definida</option>
              {catalog.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="label">Cidades onde você costuma ir</span>
            <div className="chips">
              {catalog.cities.map((c) => {
                const on = data.prefs.cityIds.includes(c.id);
                return (
                  <button key={c.id} className={`chip${on ? ' is-active' : ''}`} onClick={() => store.updatePrefs({ cityIds: on ? data.prefs.cityIds.filter((x) => x !== c.id) : [...data.prefs.cityIds, c.id] })}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <span className="label">Você viajaria para eventos?</span>
            <div className="chips">
              {TRAVEL.map(([id, l]) => (
                <button key={id} className={`chip${data.prefs.travel === id ? ' is-active' : ''}`} onClick={() => store.updatePrefs({ travel: id })}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Quanto costuma gastar</span>
            <div className="chips">
              {BUDGET.map(([id, l]) => (
                <button key={id} className={`chip${data.prefs.budget === id ? ' is-active' : ''}`} onClick={() => store.updatePrefs({ budget: data.prefs.budget === id ? null : id })}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Link to="/app/alertas?tab=config" className="link">
            Configurar alertas →
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Artistas que você segue</h2>
            <p>A área de acompanhamento é individual para cada artista.</p>
          </div>
        </div>
        <div className="card">
          {data.artistPrefs.length === 0 && <p className="muted" style={{ padding: 16 }}>Nenhum artista ainda.</p>}
          {data.artistPrefs.map((p) => {
            const a = catalog.artist(p.artistId);
            if (!a) return null;
            return (
              <div className="list-item" key={a.id}>
                <UserAvatar name={a.name} hue={a.hue} size={42} />
                <div className="list-item__main">
                  <strong>{a.name}</strong>
                  <small>📍 {describeScope(p, catalog.cityName, home?.name)}</small>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setArtist(a)}>
                  Editar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Personalização</h2>
            <p>O que usamos para recomendar eventos. Você mantém o controle.</p>
          </div>
        </div>
        <div className="card card-pad stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Usamos artistas seguidos, eventos do Radar, cidades, faixa de preço, eventos que você abriu ({data.behavior.clickedEventIds.length}) e eventos que você marcou como “não tenho interesse” ({data.behavior.ignoredEventIds.length}).
          </p>
          {data.behavior.ignoredEventIds.length > 0 && (
            <div className="chips">
              {data.behavior.ignoredEventIds.map((id) => (
                <span key={id} className="chip">
                  {world.events.find((e) => e.id === id)?.title ?? id}
                </span>
              ))}
            </div>
          )}
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => store.clearBehavior()}>
              Limpar histórico de interações
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Plano</h2>
        </div>
        <div className="grid grid--2">
          <div className="card card-pad">
            <span className="badge badge--purple">Seu plano</span>
            <h3 style={{ marginTop: 10 }}>{plan.name}</h3>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
              {data.radar.length}/{plan.limits.radarItems} itens no Radar · {data.rules.length}/{plan.limits.priceRules} alertas de preço
            </p>
          </div>
          <div className="card card-pad" style={{ opacity: 0.8 }}>
            <span className="badge">Em breve</span>
            <h3 style={{ marginTop: 10 }}>Premium</h3>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
              Mais itens monitorados, mais preços-alvo, histórico avançado e notificações prioritárias. Ainda não disponível.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <Link to="/app/comunidade" className="list-item">
            <div className="list-item__main">
              <strong>Comunidade, retrospectiva e conquistas</strong>
              <small>Chegam na próxima fase</small>
            </div>
            <span className="faint">→</span>
          </Link>
          <button
            className="list-item"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => {
              if (confirm('Reiniciar a demonstração? Preços, eventos e alertas voltam ao início.')) store.resetDemo();
            }}
          >
            <div className="list-item__main">
              <strong>Reiniciar demonstração</strong>
              <small>Volta preços, eventos e alertas ao estado inicial</small>
            </div>
          </button>
          <button
            className="list-item"
            style={{ width: '100%', textAlign: 'left', color: 'var(--red)' }}
            onClick={() => {
              store.signOut();
              navigate('/');
            }}
          >
            <LogOut size={18} />
            <div className="list-item__main">
              <strong>Sair</strong>
            </div>
          </button>
        </div>
      </section>

      {artist && <FollowModal artist={artist} onClose={() => setArtist(null)} />}
    </>
  );
}
