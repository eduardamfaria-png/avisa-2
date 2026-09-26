/**
 * Worker de monitoramento periódico (esqueleto do backend).
 *
 * Executa o mesmo fluxo usado pela simulação no navegador:
 *   1. consultar fontes  2. novos eventos  3. preços  4. comparar histórico
 *   5. quedas  6. novo menor preço  7. atualizar banco  8. gerar alertas
 *
 * Hoje usa as fontes fictícias e um "banco" em memória. Em produção:
 *   - troque `createMockRegistry` por um registry com integrações autorizadas;
 *   - troque o estado em memória por um repositório (ex.: Postgres via Prisma,
 *     schema em docs/schema.prisma);
 *   - rode via cron/fila (ex.: a cada 5–15 min) e envie as notificações por
 *     push/e-mail (fase 3).
 *
 * Uso:  npm run monitor            (roda 5 ciclos e sai)
 *       MONITOR_CYCLES=0 MONITOR_INTERVAL_MS=60000 npm run monitor   (contínuo)
 */
import { formatBRL, formatPercent } from '../src/core/format';
import { buildNotifications } from '../src/core/monitoring/notifications';
import { runMonitoringCycle } from '../src/core/monitoring/runCycle';
import type { WorldState } from '../src/core/types';
import { artists, cities } from '../src/mocks/catalog';
import { createDemoAccount } from '../src/mocks/demoUser';
import { createMockRegistry } from '../src/mocks/sources';
import { createDemoWorld } from '../src/mocks/world';

const cycles = Number(process.env.MONITOR_CYCLES ?? 5);
const interval = Number(process.env.MONITOR_INTERVAL_MS ?? 0);

async function main() {
  const anchor = new Date();
  const registry = createMockRegistry(anchor);
  let world: WorldState = createDemoWorld(anchor);
  // Um usuário de demonstração; em produção: todos os usuários com Radar/seguidos afetados.
  const users = [createDemoAccount(anchor)];
  let seq = 0;

  console.log(`[avise] ${registry.all().length} fontes registradas: ${registry.all().map((s) => `${s.name}${s.isMock ? ' (mock)' : ''}`).join(', ')}`);

  for (let i = 0; cycles === 0 || i < cycles; i++) {
    const now = new Date();
    const { world: next, report } = await runMonitoringCycle(registry, world, now);
    world = next; // passo 7: persistir

    console.log(`\n[ciclo ${report.cycle}] ${report.sourcesQueried} fontes · ${report.listingsChecked} ofertas · ${report.changes.length} mudanças`);
    for (const e of report.sourceErrors) console.warn(`  ! fonte ${e.sourceId}: ${e.message}`);
    for (const c of report.changes) {
      const cmp = c.comparison;
      const extra = cmp
        ? ` ${formatBRL(cmp.previous_price)} → ${formatBRL(cmp.current_price)} (${formatPercent(cmp.percentage_change, 2)})` +
          ` price_drop=${cmp.price_drop} price_difference=${cmp.price_difference} new_lowest_price=${cmp.new_lowest_price}`
        : '';
      console.log(`  • ${c.type.padEnd(16)} ${c.eventId}${c.sectorId ? `/${c.sectorId}` : ''}${extra}`);
    }

    for (const u of users) {
      const { notifications, rules } = buildNotifications(report.changes, world, u.data, { artists, cities }, now, () => `n${seq++}`);
      u.data.rules = rules;
      for (const n of notifications) console.log(`  🔔 [${u.account.user.username}] ${n.title} — ${n.body}`);
    }

    if (interval > 0) await new Promise((r) => setTimeout(r, interval));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
