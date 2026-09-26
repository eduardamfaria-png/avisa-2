import { Check } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { UserAvatar } from '../components/UserAvatar';
import type { BudgetRange, LocationScope, TravelPreference } from '../core/types';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';

const TRAVEL: { id: TravelPreference; label: string; hint: string }[] = [
  { id: 'near', label: 'Somente perto', hint: 'Minha cidade e arredores' },
  { id: 'other_cities', label: 'Outras cidades', hint: 'Só nas cidades que eu escolhi' },
  { id: 'brazil', label: 'Brasil inteiro', hint: 'Vou onde o show estiver' },
  { id: 'international', label: 'Internacional', hint: 'Topo viajar para fora' },
];

const BUDGET: { id: BudgetRange; label: string }[] = [
  { id: 'ate_150', label: 'Até R$ 150' },
  { id: '150_400', label: 'R$ 150 a R$ 400' },
  { id: '400_1000', label: 'R$ 400 a R$ 1.000' },
  { id: 'acima_1000', label: 'Acima de R$ 1.000' },
];

const SCOPE_FOR: Record<TravelPreference, LocationScope> = {
  near: 'radius',
  other_cities: 'cities',
  brazil: 'brazil',
  international: 'international',
};

export function Onboarding() {
  const { user, store } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [travel, setTravel] = useState<TravelPreference>('other_cities');
  const [budget, setBudget] = useState<BudgetRange | null>(null);

  if (!user) return <Navigate to="/criar-conta" replace />;

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const finish = () => {
    store.updatePrefs({ homeCityId: cityIds[0] ?? null, cityIds, travel, budget });
    for (const id of artistIds) store.followArtist({ artistId: id, scope: SCOPE_FOR[travel], radiusKm: 150, cityIds });
    store.updateUser({ onboarded: true });
    const next = params.get('next');
    navigate(next && next.startsWith('/app') ? next : '/app', { replace: true });
  };

  const steps = [
    {
      title: 'O que você gosta de acompanhar?',
      sub: 'Escolha artistas. Você pode seguir outros depois.',
      body: (
        <div className="onb-artists">
          {catalog.artists.map((a) => {
            const on = artistIds.includes(a.id);
            return (
              <button key={a.id} className={`onb-artist${on ? ' is-active' : ''}`} onClick={() => toggle(artistIds, setArtistIds, a.id)} aria-pressed={on}>
                <span style={{ position: 'relative' }}>
                  <UserAvatar name={a.name} hue={a.hue} size={68} />
                  {on && (
                    <span className="onb-check">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span>{a.name}</span>
              </button>
            );
          })}
        </div>
      ),
      ok: true,
    },
    {
      title: 'Onde você costuma ir?',
      sub: 'A primeira cidade escolhida vira a sua cidade principal.',
      body: (
        <div className="chips">
          {catalog.cities.map((c) => {
            const idx = cityIds.indexOf(c.id);
            return (
              <button key={c.id} className={`chip${idx >= 0 ? ' is-active' : ''}`} onClick={() => toggle(cityIds, setCityIds, c.id)}>
                {c.name}
                {idx === 0 && <small style={{ color: '#b7a4ff' }}>· principal</small>}
              </button>
            );
          })}
        </div>
      ),
      ok: cityIds.length > 0,
    },
    {
      title: 'Você viajaria para eventos?',
      sub: 'Vale como padrão para os artistas que você seguir.',
      body: (
        <div className="stack">
          {TRAVEL.map((t) => (
            <button key={t.id} className={`option${travel === t.id ? ' is-active' : ''}`} onClick={() => setTravel(t.id)}>
              <span className="option__radio" />
              <span>
                <strong>{t.label}</strong>
                <small>{t.hint}</small>
              </span>
            </button>
          ))}
        </div>
      ),
      ok: true,
    },
    {
      title: 'Quanto costuma gastar?',
      sub: 'Por ingresso. Ajuda a priorizar recomendações.',
      body: (
        <div className="stack">
          {BUDGET.map((b) => (
            <button key={b.id} className={`option${budget === b.id ? ' is-active' : ''}`} onClick={() => setBudget(b.id)}>
              <span className="option__radio" />
              <strong>{b.label}</strong>
            </button>
          ))}
        </div>
      ),
      ok: true,
    },
  ];
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="onb">
      <div className="onb__top">
        <Logo />
        <button className="btn btn-ghost btn-sm" onClick={finish}>
          Pular
        </button>
      </div>
      <div className="onb__progress" aria-label={`Passo ${step + 1} de ${steps.length}`}>
        {steps.map((_, i) => (
          <span key={i} className={i <= step ? 'is-on' : ''} />
        ))}
      </div>
      <div className="onb__body" key={step}>
        <h1>{s.title}</h1>
        <p className="muted" style={{ margin: '8px 0 24px' }}>
          {s.sub}
        </p>
        {s.body}
        <p className="faint" style={{ fontSize: 12.5, marginTop: 20 }}>
          Essas preferências são só um ponto de partida. Você pode mudar tudo depois no Perfil.
        </p>
      </div>
      <div className="onb__foot">
        {step > 0 && (
          <button className="btn btn-secondary btn-lg" onClick={() => setStep(step - 1)}>
            Voltar
          </button>
        )}
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={!s.ok} onClick={() => (last ? finish() : setStep(step + 1))}>
          {last ? 'Criar meu Avisê' : step === 0 && artistIds.length ? `Continuar (${artistIds.length})` : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
