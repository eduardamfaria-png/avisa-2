import type { EventUpdate } from '../sources/types';
import type { AlertType, Event, ID, PricePoint, TicketListing, WorldState } from '../types';
import { comparePrices, isImportantDrop, type PriceComparison } from './priceChange';

/** Uma mudança relevante detectada em um ciclo, antes de virar notificação. */
export interface Change {
  type: AlertType;
  eventId: ID;
  artistIds: ID[];
  sectorId: ID | null;
  listingId: ID | null;
  importance: 'high' | 'normal';
  comparison?: PriceComparison;
  batch?: { from?: string; to?: string };
}

export interface DetectInput {
  world: WorldState;
  eventUpdates: EventUpdate[];
  /** Ofertas retornadas, agrupadas por fonte que respondeu no ciclo. */
  listingsBySource: Map<ID, TicketListing[]>;
  resaleSourceIds: Set<ID>;
  now: Date;
}

export interface DetectResult {
  world: WorldState;
  changes: Change[];
}

/**
 * Passos 2–7 do fluxo de monitoramento:
 * verifica novos eventos, verifica preços, compara com histórico,
 * detecta quedas / novo menor preço e produz o novo estado.
 * Função pura: não acessa rede, banco nem relógio.
 */
export function detectChanges(input: DetectInput): DetectResult {
  const { world, eventUpdates, listingsBySource, resaleSourceIds, now } = input;
  const nowIso = now.toISOString();
  const changes: Change[] = [];

  // ── Eventos ──
  const events = new Map<ID, Event>(world.events.map((e) => [e.id, { ...e }]));

  for (const u of eventUpdates) {
    if (u.kind === 'new') {
      if (events.has(u.event.id)) continue;
      events.set(u.event.id, { ...u.event, announcedAt: nowIso, updatedAt: nowIso });
      changes.push(eventChange('new_event', u.event, 'high'));
      continue;
    }
    const prev = events.get(u.eventId);
    if (!prev) continue;
    const next: Event = { ...prev, ...u.patch, updatedAt: nowIso };
    events.set(next.id, next);
    changes.push(...statusChanges(prev, next));
  }

  // ── Ofertas: substitui as ofertas de cada fonte que respondeu ──
  const nextListings: TicketListing[] = world.listings.filter((l) => !listingsBySource.has(l.sourceId));
  for (const ls of listingsBySource.values()) nextListings.push(...ls);

  // Revenda encontrada para evento esgotado → status "resale".
  for (const ev of events.values()) {
    if (ev.status !== 'sold_out') continue;
    const hasResale = nextListings.some(
      (l) => l.eventId === ev.id && l.available && resaleSourceIds.has(l.sourceId),
    );
    if (hasResale) {
      const next = { ...ev, status: 'resale' as const, updatedAt: nowIso };
      events.set(ev.id, next);
      changes.push(eventChange('resale_available', next, 'high'));
    }
  }

  // ── Preços por setor ──
  const history: PricePoint[] = [...world.history];
  const keys = new Set<string>();
  for (const l of [...world.listings, ...nextListings]) keys.add(`${l.eventId}|${l.sectorId}`);

  for (const key of keys) {
    const [eventId, sectorId] = key.split('|');
    const ev = events.get(eventId);
    if (!ev) continue;
    const before = lowest(world.listings, eventId, sectorId);
    const after = lowest(nextListings, eventId, sectorId);
    const hadAny = world.listings.some((l) => l.eventId === eventId && l.sectorId === sectorId);
    const sectorPoints = history.filter((p) => p.eventId === eventId && p.sectorId === sectorId);
    const historicLowest = sectorPoints.length ? Math.min(...sectorPoints.map((p) => p.price)) : null;

    if (after) {
      const last = sectorPoints.length ? sectorPoints[sectorPoints.length - 1] : null;
      if (!last || last.price !== after.price) {
        history.push({ eventId, sectorId, price: after.price as number, sourceId: after.sourceId, at: nowIso });
      }
    }

    if (!before && after && hadAny) {
      const isLowest = historicLowest != null && (after.price as number) < historicLowest;
      changes.push({
        ...base(isLowest ? 'new_lowest' : 'back_in_stock', ev, isLowest ? 'high' : 'normal'),
        sectorId,
        listingId: after.id,
      });
      continue;
    }
    if (!before || !after || before.price === after.price) continue;

    const cmp = comparePrices(before.price as number, after.price as number, historicLowest);
    if (cmp.price_drop) {
      changes.push({
        ...base('price_drop', ev, isImportantDrop(cmp) ? 'high' : 'normal'),
        sectorId,
        listingId: after.id,
        comparison: cmp,
      });
    } else {
      changes.push({ ...base('price_increase', ev, cmp.percentage_change >= 15 ? 'high' : 'normal'), sectorId, listingId: after.id, comparison: cmp });
    }
  }

  return {
    world: {
      cycle: world.cycle + 1,
      lastRunAt: nowIso,
      events: [...events.values()],
      listings: nextListings,
      history,
    },
    changes,
  };
}

function lowest(listings: TicketListing[], eventId: ID, sectorId: ID): TicketListing | null {
  let best: TicketListing | null = null;
  for (const l of listings) {
    if (l.eventId !== eventId || l.sectorId !== sectorId || !l.available || l.price == null) continue;
    if (!best || l.price < (best.price as number)) best = l;
  }
  return best;
}

function base(type: AlertType, ev: Event, importance: 'high' | 'normal'): Change {
  return { type, eventId: ev.id, artistIds: ev.artistIds, sectorId: null, listingId: null, importance };
}

function eventChange(type: AlertType, ev: Event, importance: 'high' | 'normal'): Change {
  return base(type, ev, importance);
}

function statusChanges(prev: Event, next: Event): Change[] {
  const out: Change[] = [];
  if (prev.status !== next.status) {
    if (next.status === 'presale') out.push(eventChange('sales_soon', next, 'normal'));
    if (next.status === 'on_sale') out.push(eventChange('sales_open', next, 'high'));
    if (next.status === 'sold_out') out.push(eventChange('sold_out', next, 'high'));
    if (next.status === 'resale') {
      if (prev.status === 'on_sale' || prev.status === 'presale') out.push(eventChange('sold_out', next, 'high'));
      out.push(eventChange('resale_available', next, 'high'));
    }
  }
  if (prev.currentBatch && next.currentBatch && prev.currentBatch !== next.currentBatch) {
    out.push({ ...eventChange('batch_change', next, 'normal'), batch: { from: prev.currentBatch, to: next.currentBatch } });
  }
  return out;
}
