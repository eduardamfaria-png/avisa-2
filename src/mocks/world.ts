/**
 * ⚠️ DADOS DE DEMONSTRAÇÃO — estado inicial do "mundo" monitorado.
 */
import type { PricePoint, WorldState } from '../core/types';
import { eventSeeds } from './catalog';
import { buildEvent, initialListings } from './sources';

const DAY = 86_400_000;

export function createDemoWorld(anchor: Date): WorldState {
  const events = eventSeeds.filter((s) => s.announceAtCycle == null).map((s) => buildEvent(s, anchor, 0));
  const listings = initialListings(anchor, events.map((e) => e.id));

  // Histórico passado a partir das séries de preço das sementes (um ponto a cada ~4 dias).
  const history: PricePoint[] = [];
  for (const seed of eventSeeds) {
    if (seed.announceAtCycle != null) continue;
    const series = { ...seed.official, ...seed.resale };
    const sourceId = seed.resale ? 'demo-revenda-a' : 'demo-oficial';
    for (const [sectorId, prices] of Object.entries(series)) {
      if (!prices) continue;
      prices.forEach((price, i) => {
        const back = (prices.length - 1 - i) * 4 * DAY + 3 * 3_600_000;
        history.push({ eventId: seed.id, sectorId, price, sourceId, at: new Date(anchor.getTime() - back).toISOString() });
      });
    }
  }
  history.sort((a, b) => a.at.localeCompare(b.at));

  return { cycle: 0, lastRunAt: null, events, listings, history };
}
