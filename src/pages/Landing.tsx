import { ArrowDown, Bell, CalendarDays, Radar, Search, SlidersHorizontal } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useApp } from '../state/hooks';

const ALERTS = [
  { emoji: '🔔', tone: 'green', title: 'O preço caiu!', event: 'BTS — Pista Premium', text: 'R$ 1.590 → R$ 1.290 · Você economiza R$ 300' },
  { emoji: '🎟️', tone: 'purple', title: 'Novo show anunciado', event: 'Henrique & Juliano', text: 'Nova data no Rio de Janeiro' },
  { emoji: '⏰', tone: 'yellow', title: 'Vendas começam hoje às 10h', event: 'Festival Alvorada', text: 'Fique pronto: 1º lote' },
  { emoji: '🔥', tone: 'green', title: 'Novo menor preço encontrado', event: 'Coldplay — Pista', text: 'O menor valor que já monitoramos' },
];

export function Landing() {
  const { user } = useApp();
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="landing">
      <header className="landing__nav">
        <Logo />
        <div className="row">
          <Link to="/entrar" className="btn btn-ghost btn-sm">
            Entrar
          </Link>
          <Link to="/criar-conta" className="btn btn-primary btn-sm">
            Criar conta
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="badge badge--purple badge--live">Seu radar pessoal de eventos e ingressos</span>
          <h1>Nunca mais perca o ingresso que você estava esperando.</h1>
          <p>Acompanhe artistas, eventos, preços e oportunidades em um único lugar. Você escolhe o que quer. O AVISÊ fica de olho.</p>
          <div className="hero__cta">
            <Link to="/criar-conta" className="btn btn-primary btn-lg">
              Criar meu Avisê
            </Link>
            <Link to="/app/explorar" className="btn btn-secondary btn-lg">
              Explorar eventos
            </Link>
          </div>
          <p className="faint" style={{ fontSize: 13 }}>
            Grátis. Sem precisar entrar todo dia nas plataformas.
          </p>
        </div>

        <div className="hero__visual" aria-label="Exemplo de queda de preço">
          <div className="hero__rings" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="price-demo card">
            <div className="faint" style={{ fontSize: 13 }}>
              BTS — Pista Premium · São Paulo
            </div>
            <div className="price-demo__old num">R$ 1.850</div>
            <ArrowDown className="price-demo__arrow" size={26} />
            <div className="price-demo__new num">R$ 1.290</div>
            <span className="delta delta--down" style={{ fontSize: 15 }}>
              -30%
            </span>
          </div>
          <div className="toast hero__toast">
            <div className="toast__icon">🔔</div>
            <div className="toast__body">
              <strong>O preço caiu!</strong>
              <p>BTS — Pista Premium · R$ 1.590 → R$ 1.290</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__section">
        <h2>Como funciona</h2>
        <div className="how">
          {[
            { icon: Search, t: 'Escolha', d: 'Busque artistas, shows e festivais que você não quer perder.' },
            { icon: SlidersHorizontal, t: 'Configure', d: 'Defina cidades, setor e quanto você topa pagar.' },
            { icon: Radar, t: 'A gente fica de olho', d: 'Monitoramos anúncios, lotes, preços e revendas continuamente.' },
            { icon: Bell, t: 'Você só age quando importa', d: 'Receba o alerta e vá direto para o ingresso.' },
          ].map(({ icon: Icon, t, d }, i) => (
            <div className="card card-pad how__item" key={t}>
              <span className="how__n">{i + 1}</span>
              <Icon size={22} color="var(--purple)" />
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section landing__split">
        <div>
          <h2>Alertas que valem a pena</h2>
          <p className="muted" style={{ marginTop: 10, maxWidth: 440 }}>
            Novo show anunciado, abertura de vendas, mudança de lote, queda de preço, novo menor preço, ingresso de volta, esgotado, revenda — e o seu preço-alvo.
          </p>
          <div className="row wrap" style={{ marginTop: 18 }}>
            <span className="badge badge--green">↓ Queda de preço</span>
            <span className="badge badge--yellow">Abertura de vendas</span>
            <span className="badge badge--purple">Revenda</span>
            <span className="badge badge--red">Esgotado</span>
            <span className="badge badge--blue">
              <CalendarDays /> Novo evento
            </span>
          </div>
        </div>
        <div className="stack">
          {ALERTS.map((a) => (
            <div className="card alert-card" key={a.title}>
              <div className={`alert-card__icon alert-card__icon--${a.tone}`}>{a.emoji}</div>
              <div className="alert-card__body">
                <div className="alert-card__title">{a.title}</div>
                <div className="alert-card__event">{a.event}</div>
                <p className="alert-card__text">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section landing__final">
        <h2>“Coloquei o show no AVISÊ. Agora não preciso ficar procurando todo dia.”</h2>
        <Link to="/criar-conta" className="btn btn-primary btn-lg">
          Criar meu Avisê
        </Link>
        <p className="faint" style={{ fontSize: 12.5, maxWidth: 560 }}>
          Versão de demonstração: os eventos, preços e fontes exibidos no produto são fictícios. O AVISÊ não vende ingressos — ele monitora fontes autorizadas e leva você até elas.
        </p>
      </section>
    </div>
  );
}
