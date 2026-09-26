import { Check, Loader2, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { scenario } from '../mocks/scenario';
import { fmtRelative } from '../lib/dates';
import { useApp } from '../state/hooks';
import { useToast } from './Toast';

const STEPS = [
  'Consultar fontes disponíveis',
  'Verificar novos eventos',
  'Verificar preços',
  'Comparar com histórico',
  'Detectar quedas',
  'Detectar novo menor preço',
  'Atualizar banco',
  'Gerar alertas',
];

/**
 * Controle da simulação do monitoramento (modo demonstração).
 * Em produção, o mesmo ciclo roda no worker (`server/worker.ts`) em intervalos.
 */
export function SimulationPanel({ compact }: { compact?: boolean }) {
  const { world, store } = useApp();
  const running = useSyncExternalStore(store.subscribe, () => store.running);
  const auto = useSyncExternalStore(store.subscribe, () => store.autoRunning);
  const toast = useToast();
  const [step, setStep] = useState(-1);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 85);
    return () => clearInterval(t);
  }, [running]);

  const next = scenario.filter((s) => s.cycle === world.cycle + 1);

  const run = async () => {
    try {
      const { report, notifications } = await store.runCycle();
      setStep(STEPS.length);
      const s = `Ciclo ${report.cycle}: ${report.sourcesQueried} fontes consultadas, ${report.listingsChecked} ofertas verificadas, ${report.changes.length} mudanças, ${notifications.length} alertas para você.`;
      setSummary(s);
      if (!notifications.length) toast({ icon: '📡', title: 'Nada novo desta vez', text: 'Nenhuma mudança relevante para o seu Radar. Seguimos de olho.' });
    } catch (e) {
      toast({ icon: '⚠️', title: 'Não foi possível rodar o ciclo', text: (e as Error).message });
    }
  };

  return (
    <section className="sim" aria-label="Simulação de monitoramento">
      <div className="sim__head">
        <div className={`sim__radar${running || auto ? ' is-on' : ''}`} aria-hidden />
        <div className="spacer">
          <div className="row" style={{ gap: 8 }}>
            <strong>{compact ? 'Simulação' : 'Monitoramento'}</strong>
            {!compact && <span className="demo-tag">Simulação</span>}
          </div>
          <div className="faint" style={{ fontSize: 13 }}>
            Ciclo {world.cycle} · {world.lastRunAt ? `última verificação ${fmtRelative(world.lastRunAt)}` : 'ainda não verificado'}
          </div>
        </div>
      </div>

      {!compact && (
        <p className="muted" style={{ fontSize: 13.5, marginTop: 12 }}>
          Em produção o AVISÊ verifica as fontes sozinho, periodicamente. Aqui você dispara um ciclo para ver o fluxo acontecer com dados fictícios.
          {next.length > 0 && (
            <>
              {' '}
              <b style={{ color: 'var(--text)' }}>Próximo ciclo:</b> {next.map((n) => n.note.toLowerCase()).join('; ')}.
            </>
          )}
        </p>
      )}

      <div className="row wrap" style={{ marginTop: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={run} disabled={running}>
          {running ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          {running ? 'Verificando…' : 'Rodar ciclo agora'}
        </button>
        <button className={`btn btn-sm ${auto ? 'btn-success' : 'btn-secondary'}`} onClick={() => store.setAuto(!auto)}>
          {auto ? 'Automático: ligado' : 'Automático (8s)'}
        </button>
        {!compact && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('Reiniciar a demonstração? Preços, eventos e alertas voltam ao início.')) {
                store.resetDemo();
                setSummary(null);
                setStep(-1);
              }
            }}
          >
            <RotateCcw size={15} /> Reiniciar
          </button>
        )}
      </div>

      {(running || step >= 0) && !compact && (
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step || (!running && step >= STEPS.length) ? 'is-done' : i === step && running ? 'is-active' : ''}>
              {i < step || (!running && step >= STEPS.length) ? <Check size={14} /> : i === step && running ? <Loader2 size={14} className="spin" /> : <span style={{ width: 14 }} />}
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      )}
      {summary && !running && <div className="sim__log">{summary}</div>}
    </section>
  );
}
