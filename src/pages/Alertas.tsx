import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCard } from '../components/AlertCard';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { SimulationPanel } from '../components/SimulationPanel';
import { useToast } from '../components/Toast';
import { formatBRL } from '../core/format';
import { cheapestListing } from '../core/market';
import { PLANS } from '../core/plans';
import type { AlertLevel, AlertSettingKey } from '../core/types';
import { ALERT_FILTERS } from '../lib/status';
import { catalog } from '../services/catalog';
import { useApp } from '../state/hooks';

const SETTINGS: { key: AlertSettingKey; label: string; hint: string }[] = [
  { key: 'new_events', label: 'Novos eventos', hint: 'Shows anunciados dos artistas que você segue' },
  { key: 'sales_open', label: 'Abertura de vendas', hint: 'Data de venda definida e vendas abertas' },
  { key: 'price_drop', label: 'Queda de preço', hint: 'Importantes: quedas de 10% ou mais' },
  { key: 'price_increase', label: 'Aumento de preço', hint: 'Importantes: altas de 15% ou mais' },
  { key: 'new_lowest', label: 'Novo menor preço', hint: 'Menor valor já monitorado' },
  { key: 'batch_change', label: 'Mudança de lote', hint: 'Virada de lote nas vendas oficiais' },
  { key: 'sold_out', label: 'Esgotamento', hint: 'Ingressos oficiais esgotados' },
  { key: 'resale', label: 'Revenda', hint: 'Revenda encontrada ou ingresso de volta' },
  { key: 'opportunities', label: 'Oportunidades', hint: 'Boas quedas em eventos de artistas que você segue' },
];

const LEVELS: [AlertLevel, string][] = [
  ['always', 'Sempre'],
  ['important', 'Importantes'],
  ['off', 'Desativado'],
];

export function Alertas() {
  const { data, world, store } = useApp();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'feed';
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  if (!data) return null;

  const types = ALERT_FILTERS.find((f) => f.id === filter)!.types;
  const list = data.notifications.filter((n) => !types.length || types.includes(n.type));
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alertas</h1>
          <p>Quando algo importante acontece, aparece aqui.</p>
        </div>
        {tab === 'feed' && unread > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => store.markAllRead()}>
            Marcar todos como lidos
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        {[
          ['feed', 'Notificações', unread],
          ['precos', 'Alertas de preço', data.rules.length],
          ['config', 'Configurações', 0],
        ].map(([id, label, count]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setParams(id === 'feed' ? {} : { tab: String(id) })}>
            {label}
            {Number(count) > 0 && <span className="count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="alerts-layout">
          <div className="stack">
            <div className="chips chips--scroll">
              {ALERT_FILTERS.map((f) => (
                <button key={f.id} className={`chip${filter === f.id ? ' is-active' : ''}`} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            {list.length === 0 ? (
              <div className="empty">
                <h3>Nenhum alerta ainda</h3>
                <p>Estamos de olho. Rode um ciclo de monitoramento para ver o que muda nos eventos do seu Radar.</p>
              </div>
            ) : (
              list.map((n) => <AlertCard key={n.id} n={n} />)
            )}
          </div>
          <div className="alerts-aside">
            <SimulationPanel />
          </div>
        </div>
      )}

      {tab === 'precos' && (
        <div className="stack" style={{ maxWidth: 760 }}>
          <div className="row">
            <p className="muted spacer" style={{ fontSize: 14 }}>
              {data.rules.length} de {PLANS.free.limits.priceRules} alertas de preço no plano {PLANS.free.name}.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
              <Plus size={16} /> Criar alerta de preço
            </button>
          </div>
          {data.rules.length === 0 && (
            <div className="empty">
              <h3>Nenhum preço-alvo</h3>
              <p>Exemplo: “Me avise quando encontrar BTS por menos de R$ 1.500.”</p>
            </div>
          )}
          {data.rules.length > 0 && (
            <div className="card">
              {data.rules.map((r) => {
                const ev = world.events.find((e) => e.id === r.eventId);
                if (!ev) return null;
                const sector = r.sectorId ? ev.sectors.find((s) => s.id === r.sectorId)?.name : 'Qualquer setor';
                const now = cheapestListing(world.listings, ev.id, r.sectorId, r.sourceId)?.price ?? null;
                const hit = now != null && now <= r.maxPrice;
                return (
                  <div className="list-item" key={r.id} style={{ opacity: r.active ? 1 : 0.55 }}>
                    <div className="list-item__main">
                      <Link to={`/app/evento/${ev.id}`}>
                        <strong>{ev.title}</strong>
                      </Link>
                      <small>
                        {sector} · {r.sourceId ? catalog.source(r.sourceId)?.name : 'qualquer fonte'} · abaixo de <b style={{ color: 'var(--text)' }}>{formatBRL(r.maxPrice)}</b>
                      </small>
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        Agora: <b className="num">{formatBRL(now)}</b> {hit && <span style={{ color: 'var(--green)', fontWeight: 600 }}>· Preço atingido!</span>}
                        {r.id.startsWith('radar-') && <span className="faint"> · do Radar</span>}
                      </div>
                    </div>
                    <button className={`switch${r.active ? ' is-on' : ''}`} role="switch" aria-checked={r.active} aria-label="Ativar alerta" onClick={() => store.toggleRule(r.id)} />
                    <button className="icon-btn" aria-label="Excluir alerta" onClick={() => store.removeRule(r.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="stack" style={{ maxWidth: 760 }}>
          <p className="muted" style={{ fontSize: 14 }}>
            Escolha o que merece um alerta. “Importantes” filtra só mudanças relevantes. Alertas de preço-alvo sempre chegam enquanto estiverem ativos.
          </p>
          <div className="card">
            {SETTINGS.map((s) => (
              <div className="list-item settings-row" key={s.key}>
                <div className="list-item__main">
                  <strong>{s.label}</strong>
                  <small>{s.hint}</small>
                </div>
                <div className="seg" style={{ minWidth: 290 }}>
                  {LEVELS.map(([lv, label]) => (
                    <button key={lv} className={data.prefs.alertSettings[s.key] === lv ? 'is-active' : ''} onClick={() => store.setAlertLevel(s.key, lv)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="card card-pad">
            <strong>Canais</strong>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Nesta versão os alertas aparecem no site. Push e e-mail estão planejados para uma próxima fase.
            </p>
          </div>
        </div>
      )}

      {creating && <PriceAlertModal onClose={() => setCreating(false)} onSaved={() => toast({ icon: '🎯', title: 'Alerta de preço criado' })} />}
    </>
  );
}
