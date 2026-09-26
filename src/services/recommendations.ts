import { isInScope } from '../core/location';
import { cheapestListing, sectorHistory } from '../core/market';
import type { BudgetRange, Event, EventCategory, ID, PricePoint, TicketListing, WorldState } from '../core/types';
import type { UserData } from '../repositories/storage';
import { catalog } from './catalog';

export interface Recommendation {
  event: Event;
  reason: string;
  score: number;
}

const BUDGET_MAX: Record<BudgetRange, number> = { ate_150: 150, '150_400': 400, '400_1000': 1000, acima_1000: Infinity };
const CATEGORY_PLURAL: Record<EventCategory, string> = {
  show: 'shows',
  festival: 'festivais',
  teatro: 'espetáculos de teatro',
  'stand-up': 'stand-up',
  esporte: 'eventos esportivos',
};

export function isUpcoming(ev: Event, now = new Date()) {
  return new Date(ev.date).getTime() > now.getTime();
}

/** "Para você": pontuação transparente, sempre com o motivo principal visível. */
export function forYou(world: WorldState, data: UserData | null, now = new Date()): Recommendation[] {
  if (!data) return [];
  const inRadar = new Set(data.radar.map((r) => r.eventId));
  const ignored = new Set(data.behavior.ignoredEventIds);
  const home = catalog.city(data.prefs.homeCityId) ?? null;
  const catCount = new Map<EventCategory, number>();
  for (const r of data.radar) {
    const ev = world.events.find((e) => e.id === r.eventId);
    if (ev) catCount.set(ev.category, (catCount.get(ev.category) ?? 0) + 1);
  }

  const out: Recommendation[] = [];
  for (const ev of world.events) {
    if (inRadar.has(ev.id) || ignored.has(ev.id) || !isUpcoming(ev, now)) continue;
    const reasons: [number, string][] = [];
    const city = catalog.city(ev.cityId)!;
    for (const aid of ev.artistIds) {
      const pref = data.artistPrefs.find((p) => p.artistId === aid);
      if (!pref) continue;
      const name = catalog.artist(aid)?.name ?? '';
      if (isInScope(pref, city, home)) reasons.push([60, `Recomendado porque você segue ${name}.`]);
      else reasons.push([15, `Você segue ${name} — este show fica fora da área que você escolheu.`]);
    }
    const cc = catCount.get(ev.category) ?? 0;
    if (cc >= 1) reasons.push([12 + cc * 4, `Você costuma acompanhar ${CATEGORY_PLURAL[ev.category]}.`]);
    if (home?.id === ev.cityId || data.prefs.cityIds.includes(ev.cityId)) reasons.push([18, `Acontece em ${city.name}, uma das suas cidades.`]);
    if (data.prefs.budget) {
      const best = cheapestListing(world.listings, ev.id)?.price;
      if (best != null && best <= BUDGET_MAX[data.prefs.budget]) reasons.push([8, 'Dentro da sua faixa de preço.']);
    }
    if (data.behavior.clickedEventIds.includes(ev.id)) reasons.push([6, 'Você viu este evento recentemente.']);
    if (!reasons.length) continue;
    reasons.sort((a, b) => b[0] - a[0]);
    out.push({ event: ev, reason: reasons[0][1], score: reasons.reduce((n, r) => n + r[0], 0) });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function trending(world: WorldState, now = new Date()): Event[] {
  return world.events.filter((e) => isUpcoming(e, now)).sort((a, b) => b.watchers - a.watchers);
}

export type OpportunityKind = 'price_drop' | 'new_lowest' | 'last_tickets' | 'new_batch' | 'resale' | 'soon' | 'sales_soon';

export interface Opportunity {
  event: Event;
  kind: OpportunityKind;
  label: string;
  sectorId?: ID;
  from?: number;
  to?: number;
  priority: number;
}

const DAY = 86_400_000;

/** "Últimas oportunidades": sinais recentes derivados do histórico e do status. */
export function opportunities(world: WorldState, now = new Date()): Opportunity[] {
  const out: Opportunity[] = [];
  for (const ev of world.events) {
    if (!isUpcoming(ev, now)) continue;
    const best = drop(world.history, world.listings, ev);
    if (best) out.push(best);
    const until = new Date(ev.date).getTime() - now.getTime();
    if (ev.currentBatch === 'Lote final' && ev.status === 'on_sale') out.push({ event: ev, kind: 'last_tickets', label: 'Últimos ingressos', priority: 70 });
    if (ev.status === 'resale' && now.getTime() - new Date(ev.updatedAt).getTime() < 3 * DAY)
      out.push({ event: ev, kind: 'resale', label: 'Nova revenda encontrada', priority: 60 });
    if (ev.status === 'on_sale' && until < 7 * DAY) out.push({ event: ev, kind: 'soon', label: 'Evento chegando', priority: 40 });
    if (ev.status === 'presale' && ev.salesStartAt && new Date(ev.salesStartAt).getTime() - now.getTime() < 3 * DAY)
      out.push({ event: ev, kind: 'sales_soon', label: 'Vendas abrem em breve', priority: 50 });
  }
  // Um item por evento (o mais relevante), ordenado por prioridade.
  const byEvent = new Map<ID, Opportunity>();
  for (const o of out.sort((a, b) => b.priority - a.priority)) if (!byEvent.has(o.event.id)) byEvent.set(o.event.id, o);
  return [...byEvent.values()];
}

function drop(history: PricePoint[], listings: TicketListing[], ev: Event): Opportunity | null {
  let best: Opportunity | null = null;
  for (const s of ev.sectors) {
    const pts = sectorHistory(history, ev.id, s.id);
    if (pts.length < 2) continue;
    const [prev, last] = pts.slice(-2);
    const current = cheapestListing(listings, ev.id, s.id)?.price;
    if (current == null || current !== last.price || last.price >= prev.price) continue;
    const isLowest = last.price <= Math.min(...pts.map((p) => p.price));
    const saving = prev.price - last.price;
    const o: Opportunity = {
      event: ev,
      kind: isLowest ? 'new_lowest' : 'price_drop',
      label: isLowest ? 'Novo menor preço' : 'Preço caiu',
      sectorId: s.id,
      from: prev.price,
      to: last.price,
      priority: 80 + Math.min(saving / 20, 19),
    };
    if (!best || o.priority > best.priority) best = o;
  }
  return best;
}
