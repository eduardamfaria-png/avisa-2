/**
 * ⚠️ FONTES FICTÍCIAS (MOCK)
 *
 * Implementações de demonstração das interfaces de `core/sources`. Nenhuma
 * delas acessa plataformas reais. Para integrar uma plataforma de verdade,
 * crie um adapter em `src/integrations/` implementando a mesma interface e
 * registre-o no lugar destes (somente com autorização técnica e legal).
 */
import { SourceRegistry } from '../core/sources/registry';
import type {
  EventSource,
  EventUpdate,
  ResaleSourceAdapter,
  SourceContext,
  TicketSourceAdapter,
} from '../core/sources/types';
import type { Event, EventStatus, TicketListing, TicketSource } from '../core/types';
import { artists, eventSeeds, venues, type EventSeed } from './catalog';
import { scenario } from './scenario';

export const MOCK_TICKET_SOURCES: TicketSource[] = [
  { id: 'demo-oficial', name: 'Bilheteria Oficial (demo)', kind: 'official', isMock: true, integration: 'mock', homepage: '' },
  { id: 'demo-revenda-a', name: 'Revenda Parceira A (demo)', kind: 'resale', isMock: true, integration: 'mock', homepage: '' },
  { id: 'demo-revenda-b', name: 'Revenda Parceira B (demo)', kind: 'resale', isMock: true, integration: 'mock', homepage: '' },
];

const DAY = 86_400_000;
const seedById = new Map(eventSeeds.map((s) => [s.id, s]));

// ───────────── Leitura do roteiro por ciclo (determinística) ─────────────

function stepsFor(eventId: string, cycle: number) {
  return scenario.filter((s) => s.eventId === eventId && s.cycle <= cycle);
}

export function statusAt(seed: EventSeed, cycle: number): EventStatus {
  let st = seed.status;
  for (const s of stepsFor(seed.id, cycle)) if (s.status) st = s.status;
  return st;
}

function batchAt(seed: EventSeed, cycle: number): string | undefined {
  let b = seed.batch;
  for (const s of stepsFor(seed.id, cycle)) if (s.batch) b = s.batch;
  return b;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Preço de um setor em um ciclo. `undefined` = setor não existe nessa fonte;
 * `null` = existe mas indisponível.
 */
function priceAt(seed: EventSeed, kind: 'official' | 'resale', sectorId: string, cycle: number): number | null | undefined {
  const seeded = seed[kind]?.[sectorId];
  let price: number | null | undefined = seeded === undefined ? undefined : seeded === null ? null : seeded[seeded.length - 1];
  let lastScripted = 0;
  for (const s of scenario) {
    if (s.eventId !== seed.id || !s[kind] || !(sectorId in s[kind]!)) continue;
    lastScripted = Math.max(lastScripted, s.cycle);
    if (s.cycle <= cycle) price = s[kind]![sectorId];
  }
  if (kind === 'resale' && price != null && cycle > lastScripted) {
    // Oscilação de revenda depois do roteiro: ±7%, determinística por evento/setor/ciclo.
    const k = cycle - lastScripted;
    const phase = hash(seed.id + sectorId) * Math.PI * 2;
    price = round10(price * (1 + 0.07 * Math.sin(k * 1.9 + phase) - 0.07 * Math.sin(phase)));
  }
  return price;
}

// ───────────── Construção de eventos ─────────────

export function buildEvent(seed: EventSeed, anchor: Date, cycle: number): Event {
  const venue = venues.find((v) => v.id === seed.venueId)!;
  const date = new Date(anchor.getTime() + seed.dayOffset * DAY);
  date.setHours(seed.hour, 0, 0, 0);
  let salesStartAt: string | undefined;
  if (seed.salesInDays != null) {
    const s = new Date(anchor.getTime() + seed.salesInDays * DAY);
    s.setHours(10, 0, 0, 0);
    salesStartAt = s.toISOString();
  }
  return {
    id: seed.id,
    slug: seed.id,
    title: seed.title,
    artistIds: seed.artistIds,
    venueId: seed.venueId,
    cityId: venue.cityId,
    category: seed.category,
    date: date.toISOString(),
    description: seed.description,
    status: statusAt(seed, cycle),
    salesStartAt,
    currentBatch: batchAt(seed, cycle),
    sectors: seed.sectors,
    hue: seed.category === 'festival' ? 22 : artists.find((a) => a.id === seed.artistIds[0])?.hue ?? 250,
    watchers: seed.watchers,
    announcedAt: anchor.toISOString(),
    updatedAt: anchor.toISOString(),
    isDemo: true,
  };
}

// ───────────── Fontes ─────────────

class MockAnnouncementSource implements EventSource {
  readonly type = 'event' as const;
  readonly id = 'demo-anuncios';
  readonly name = 'Agenda de anúncios (demo)';
  readonly isMock = true;
  constructor(private anchor: Date) {}

  async fetchEvents(ctx: SourceContext): Promise<EventUpdate[]> {
    const known = new Set(ctx.knownEvents.map((e) => e.id));
    const out: EventUpdate[] = [];
    for (const seed of eventSeeds) {
      if (seed.announceAtCycle != null && seed.announceAtCycle <= ctx.cycle && !known.has(seed.id)) {
        const ev = buildEvent(seed, this.anchor, ctx.cycle);
        // Datas de venda relativas ao momento do anúncio.
        if (seed.salesInDays != null) {
          const s = new Date(ctx.now.getTime() + seed.salesInDays * DAY);
          s.setHours(10, 0, 0, 0);
          ev.salesStartAt = s.toISOString();
        }
        out.push({ kind: 'new', event: ev });
      }
    }
    for (const step of scenario) {
      if (step.cycle !== ctx.cycle || (!step.status && !step.batch) || !known.has(step.eventId)) continue;
      const patch: Extract<EventUpdate, { kind: 'patch' }>['patch'] = {};
      if (step.status) patch.status = step.status;
      if (step.batch) patch.currentBatch = step.batch;
      if (step.status === 'on_sale') patch.salesStartAt = ctx.now.toISOString();
      out.push({ kind: 'patch', eventId: step.eventId, patch });
    }
    return out;
  }
}

class MockOfficialSource implements TicketSourceAdapter {
  readonly type = 'ticket' as const;
  readonly meta = MOCK_TICKET_SOURCES[0];
  readonly id = this.meta.id;
  readonly name = this.meta.name;
  readonly isMock = true;

  async fetchListings(ctx: SourceContext): Promise<TicketListing[]> {
    return officialListings(ctx.cycle, ctx.now, ctx.knownEvents.map((e) => e.id));
  }
}

class MockResaleSource implements ResaleSourceAdapter {
  readonly type = 'resale' as const;
  readonly id: string;
  readonly name: string;
  readonly isMock = true;
  constructor(readonly meta: TicketSource, private factor: (eventId: string) => number | null) {
    this.id = meta.id;
    this.name = meta.name;
  }

  async fetchListings(ctx: SourceContext): Promise<TicketListing[]> {
    return resaleListings(this.meta.id, this.factor, ctx.cycle, ctx.now, ctx.knownEvents.map((e) => e.id));
  }
}

function officialListings(cycle: number, now: Date, eventIds: string[]): TicketListing[] {
  const out: TicketListing[] = [];
  for (const id of eventIds) {
    const seed = seedById.get(id);
    if (!seed) continue;
    const status = statusAt(seed, cycle);
    if (status === 'announced' || status === 'presale') continue;
    for (const sector of seed.sectors) {
      const price = priceAt(seed, 'official', sector.id, cycle);
      if (price === undefined) continue;
      const available = status === 'on_sale' && price != null;
      out.push(listing('demo-oficial', id, sector.id, available ? price : null, now, batchAt(seed, cycle)));
    }
  }
  return out;
}

function resaleListings(
  sourceId: string,
  factor: (eventId: string) => number | null,
  cycle: number,
  now: Date,
  eventIds: string[],
): TicketListing[] {
  const out: TicketListing[] = [];
  for (const id of eventIds) {
    const seed = seedById.get(id);
    const f = factor(id);
    if (!seed || f == null) continue;
    const status = statusAt(seed, cycle);
    if (status !== 'sold_out' && status !== 'resale') continue;
    for (const sector of seed.sectors) {
      const base = priceAt(seed, 'resale', sector.id, cycle);
      if (base === undefined) continue;
      out.push(listing(sourceId, id, sector.id, base == null ? null : round10(base * f), now));
    }
  }
  return out;
}

function listing(sourceId: string, eventId: string, sectorId: string, price: number | null, now: Date, batch?: string): TicketListing {
  return {
    id: `${sourceId}:${eventId}:${sectorId}`,
    eventId,
    sectorId,
    sourceId,
    price,
    available: price != null,
    batch,
    url: '', // mocks não têm destino real — ver página de saída
    updatedAt: now.toISOString(),
  };
}

// Revenda B lista só parte dos eventos e sempre um pouco acima da A.
const resaleBFactor = (eventId: string) => (hash(eventId) > 0.35 ? 1.04 + hash(eventId + 'b') * 0.08 : null);

export function createMockRegistry(anchor: Date): SourceRegistry {
  return new SourceRegistry()
    .register(new MockAnnouncementSource(anchor))
    .register(new MockOfficialSource())
    .register(new MockResaleSource(MOCK_TICKET_SOURCES[1], () => 1))
    .register(new MockResaleSource(MOCK_TICKET_SOURCES[2], resaleBFactor));
}

/** Listagens síncronas do ciclo 0 (estado inicial). */
export function initialListings(anchor: Date, eventIds: string[]): TicketListing[] {
  return [
    ...officialListings(0, anchor, eventIds),
    ...resaleListings('demo-revenda-a', () => 1, 0, anchor, eventIds),
    ...resaleListings('demo-revenda-b', resaleBFactor, 0, anchor, eventIds),
  ];
}
