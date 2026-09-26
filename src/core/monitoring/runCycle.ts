import type { SourceRegistry } from '../sources/registry';
import type { EventUpdate } from '../sources/types';
import type { ID, TicketListing, WorldState } from '../types';
import { detectChanges, type Change } from './detectChanges';

export interface CycleReport {
  cycle: number;
  startedAt: string;
  sourcesQueried: number;
  sourceErrors: { sourceId: ID; message: string }[];
  eventUpdates: number;
  listingsChecked: number;
  changes: Change[];
}

/**
 * Um ciclo completo de monitoramento (passos 1–7):
 * 1. consulta as fontes registradas
 * 2–6. delega a detecção para `detectChanges`
 * 7. devolve o novo estado para o chamador persistir
 *
 * A geração de alertas (passo 8) é feita por usuário em `buildNotifications`,
 * para que o worker possa processar muitos usuários sobre o mesmo ciclo.
 */
export async function runMonitoringCycle(
  registry: SourceRegistry,
  world: WorldState,
  now: Date = new Date(),
): Promise<{ world: WorldState; report: CycleReport }> {
  const ctx = { cycle: world.cycle + 1, now, knownEvents: world.events };
  const errors: CycleReport['sourceErrors'] = [];
  const eventUpdates: EventUpdate[] = [];
  const listingsBySource = new Map<ID, TicketListing[]>();
  const resaleIds = new Set<ID>();

  const eventSources = registry.eventSources();
  const listingSources = registry.listingSources();

  await Promise.all([
    ...eventSources.map(async (s) => {
      try {
        eventUpdates.push(...(await s.fetchEvents(ctx)));
      } catch (e) {
        errors.push({ sourceId: s.id, message: String(e) });
      }
    }),
    ...listingSources.map(async (s) => {
      if (s.type === 'resale') resaleIds.add(s.id);
      try {
        listingsBySource.set(s.id, await s.fetchListings(ctx));
      } catch (e) {
        // Fonte indisponível: mantém as ofertas anteriores dela.
        errors.push({ sourceId: s.id, message: String(e) });
      }
    }),
  ]);

  const { world: next, changes } = detectChanges({
    world,
    eventUpdates,
    listingsBySource,
    resaleSourceIds: resaleIds,
    now,
  });

  return {
    world: next,
    report: {
      cycle: next.cycle,
      startedAt: now.toISOString(),
      sourcesQueried: eventSources.length + listingSources.length,
      sourceErrors: errors,
      eventUpdates: eventUpdates.length,
      listingsChecked: [...listingsBySource.values()].reduce((n, l) => n + l.length, 0),
      changes,
    },
  };
}
