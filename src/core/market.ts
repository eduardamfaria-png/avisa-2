import type { ID, PricePoint, TicketListing } from './types';

/** Consultas puras sobre ofertas e histórico, usadas pelo motor e pela interface. */

export function availableListings(listings: TicketListing[], eventId: ID, sectorId?: ID | null, sourceId?: ID | null) {
  return listings.filter(
    (l) =>
      l.eventId === eventId &&
      l.available &&
      l.price != null &&
      (sectorId == null || l.sectorId === sectorId) &&
      (sourceId == null || l.sourceId === sourceId),
  );
}

export function cheapestListing(
  listings: TicketListing[],
  eventId: ID,
  sectorId?: ID | null,
  sourceId?: ID | null,
): TicketListing | null {
  let best: TicketListing | null = null;
  for (const l of availableListings(listings, eventId, sectorId, sourceId)) {
    if (!best || (l.price as number) < (best.price as number)) best = l;
  }
  return best;
}

export function sectorHistory(history: PricePoint[], eventId: ID, sectorId: ID): PricePoint[] {
  return history
    .filter((p) => p.eventId === eventId && p.sectorId === sectorId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export interface PriceStats {
  current: number | null;
  previous: number | null;
  lowest: number | null;
  highest: number | null;
  /** current - previous (negativo = queda). */
  change: number | null;
  points: PricePoint[];
}

export function priceStats(
  listings: TicketListing[],
  history: PricePoint[],
  eventId: ID,
  sectorId: ID | null,
): PriceStats {
  const current = cheapestListing(listings, eventId, sectorId)?.price ?? null;
  let points: PricePoint[];
  if (sectorId) {
    points = sectorHistory(history, eventId, sectorId);
  } else {
    // Sem setor: usa o setor do menor preço atual; se não houver, o setor com mais histórico.
    const sid =
      cheapestListing(listings, eventId)?.sectorId ??
      mostTrackedSector(history, eventId);
    points = sid ? sectorHistory(history, eventId, sid) : [];
  }
  const prices = points.map((p) => p.price);
  const previous = points.length >= 2 ? points[points.length - 2].price : null;
  const last = points.length ? points[points.length - 1].price : null;
  const cur = current ?? last;
  return {
    current: cur,
    previous,
    lowest: prices.length ? Math.min(...prices) : cur,
    highest: prices.length ? Math.max(...prices) : cur,
    change: cur != null && previous != null ? cur - previous : null,
    points,
  };
}

function mostTrackedSector(history: PricePoint[], eventId: ID): ID | null {
  const count = new Map<ID, number>();
  for (const p of history) if (p.eventId === eventId) count.set(p.sectorId, (count.get(p.sectorId) ?? 0) + 1);
  let best: ID | null = null;
  let max = 0;
  for (const [k, v] of count) if (v > max) [best, max] = [k, v];
  return best;
}
