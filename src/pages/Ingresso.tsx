import { ArrowLeft, ExternalLink, FlaskConical, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Link, useGoBack } from '../lib/links';
import { formatBRL } from '../core/format';
import { outboundUrl } from '../core/plans';
import { fmtDateLong, fmtRelative } from '../lib/dates';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';

/**
 * Última etapa do fluxo: sair do AVISÊ para a fonte do ingresso.
 * Com integrações reais, redireciona para `listing.url` (via `outboundUrl`).
 * Com fontes fictícias, explica o que aconteceria.
 */
export function Ingresso() {
  const { listingId } = useParams();
  const [params] = useSearchParams();
  const { world, user, store } = useApp();
  const goBack = useGoBack('/app');
  const listing = world.listings.find((l) => l.id === listingId);
  const event = listing && world.events.find((e) => e.id === listing.eventId);
  const source = listing && catalog.source(listing.sourceId);
  const nid = params.get('n');

  useEffect(() => {
    if (!listing) return;
    if (user) {
      store.trackOutbound(listing.id);
      if (nid) store.markRead(nid);
    }
    if (source && !source.isMock && listing.url) window.location.href = outboundUrl(listing.url, { sourceId: source.id, userId: user?.id });
  }, [listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!listing || !event || !source)
    return (
      <div className="empty">
        <h3>Oferta não encontrada</h3>
        <p>Ela pode ter saído do ar desde o último ciclo de monitoramento.</p>
        <Link className="btn btn-primary" to="/app">
          Voltar
        </Link>
      </div>
    );

  const sector = event.sectors.find((s) => s.id === listing.sectorId)?.name;

  return (
    <div className="exit">
      <button className="btn btn-ghost btn-sm" onClick={goBack} style={{ marginLeft: -10, alignSelf: 'flex-start' }}>
        <ArrowLeft size={17} /> Voltar
      </button>
      <div className="card exit__card">
        <div className="exit__radar" aria-hidden>
          <span />
          <span />
          <ExternalLink size={26} />
        </div>
        <h1>Indo para {source.name}</h1>
        <p className="muted">O AVISÊ não vende ingressos. A compra acontece direto na fonte.</p>

        <div className="exit__summary">
          <div>
            <span className="faint">Evento</span>
            <strong>{event.title}</strong>
            <small className="muted">{fmtDateLong(event.date)}</small>
          </div>
          <div>
            <span className="faint">Setor</span>
            <strong>{sector}</strong>
            <small className="muted">{source.kind === 'official' ? 'Venda oficial' : 'Revenda'}</small>
          </div>
          <div>
            <span className="faint">Preço encontrado</span>
            <strong className="num" style={{ fontSize: 24, color: 'var(--green)' }}>
              {formatBRL(listing.price)}
            </strong>
            <small className="muted">verificado {fmtRelative(listing.updatedAt)}</small>
          </div>
        </div>

        {source.isMock ? (
          <div className="demo-banner" style={{ textAlign: 'left' }}>
            <FlaskConical size={18} />
            <span>
              <b>Fonte fictícia (demonstração).</b> Com uma plataforma parceira integrada, este botão abriria a página do ingresso na fonte oficial ou de revenda. Nenhum dado aqui é real.
            </span>
          </div>
        ) : (
          <p className="muted">Redirecionando…</p>
        )}

        <div className="row wrap" style={{ justifyContent: 'center', marginTop: 4 }}>
          <button className="btn btn-primary btn-lg" disabled={source.isMock} title={source.isMock ? 'Indisponível em fontes fictícias' : undefined}>
            <ExternalLink size={18} /> Abrir no site da fonte
          </button>
          <Link className="btn btn-secondary btn-lg" to={`/app/evento/${event.id}`}>
            Ver evento
          </Link>
        </div>
        <p className="hint row" style={{ justifyContent: 'center' }}>
          <ShieldCheck size={15} /> Confira preço, taxas e política de revenda na fonte antes de comprar.
        </p>
      </div>
    </div>
  );
}
