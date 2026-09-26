import { formatBRL, formatPercent } from '../format';
import { isInScope } from '../location';
import { cheapestListing } from '../market';
import type {
  AlertLevel,
  AlertSettingKey,
  AlertType,
  Artist,
  ArtistPreference,
  City,
  Event,
  ID,
  Notification,
  PriceAlertRule,
  RadarItem,
  UserPreference,
  WorldState,
} from '../types';
import type { Change } from './detectChanges';

export interface UserMonitoringContext {
  radar: RadarItem[];
  artistPrefs: ArtistPreference[];
  rules: PriceAlertRule[];
  prefs: UserPreference;
}

export interface Catalog {
  artists: Artist[];
  cities: City[];
}

export const SETTING_FOR_TYPE: Record<AlertType, AlertSettingKey | null> = {
  new_event: 'new_events',
  sales_soon: 'sales_open',
  sales_open: 'sales_open',
  price_drop: 'price_drop',
  price_increase: 'price_increase',
  new_lowest: 'new_lowest',
  batch_change: 'batch_change',
  sold_out: 'sold_out',
  back_in_stock: 'resale',
  resale_available: 'resale',
  target_reached: null, // pedido explícito do usuário: controlado pela própria regra
};

function passes(level: AlertLevel, importance: 'high' | 'normal') {
  return level === 'always' || (level === 'important' && importance === 'high');
}

/**
 * Passo 8 do fluxo: transforma mudanças em notificações para um usuário,
 * respeitando Radar, artistas seguidos (com área de interesse), regras de
 * preço e níveis configurados. Retorna também as regras atualizadas.
 */
export function buildNotifications(
  changes: Change[],
  world: WorldState,
  user: UserMonitoringContext,
  catalog: Catalog,
  now: Date,
  idFactory: () => string,
): { notifications: Notification[]; rules: PriceAlertRule[] } {
  const nowIso = now.toISOString();
  const events = new Map(world.events.map((e) => [e.id, e]));
  const cities = new Map(catalog.cities.map((c) => [c.id, c]));
  const artists = new Map(catalog.artists.map((a) => [a.id, a]));
  const home = user.prefs.homeCityId ? cities.get(user.prefs.homeCityId) ?? null : null;
  const radarByEvent = new Map(user.radar.map((r) => [r.eventId, r]));
  const settings = user.prefs.alertSettings;
  const out: Notification[] = [];

  const followsInScope = (ev: Event) =>
    ev.artistIds.some((aid) => {
      const pref = user.artistPrefs.find((p) => p.artistId === aid);
      const city = cities.get(ev.cityId);
      return !!pref && !!city && isInScope(pref, city, home);
    });

  for (const c of changes) {
    const ev = events.get(c.eventId);
    if (!ev) continue;
    const radar = radarByEvent.get(ev.id);
    const inRadar = !!radar && radar.alertsEnabled;
    const isPrice = c.type === 'price_drop' || c.type === 'price_increase' || c.type === 'new_lowest' || c.type === 'back_in_stock';

    // Relevância
    let viaOpportunity = false;
    if (inRadar) {
      if (isPrice && radar!.sectorId && c.sectorId !== radar!.sectorId) continue;
    } else if (followsInScope(ev)) {
      // Seguidor do artista sem o evento no Radar: só novidades do evento e boas oportunidades.
      if (isPrice) {
        if (c.type !== 'price_drop' || c.importance !== 'high') continue;
        viaOpportunity = true;
      }
    } else {
      continue;
    }

    // Preferências
    const key = viaOpportunity ? 'opportunities' : SETTING_FOR_TYPE[c.type];
    if (key) {
      let ok = passes(settings[key], c.importance);
      if (!ok && c.type === 'price_drop' && c.comparison?.new_lowest_price) ok = passes(settings.new_lowest, 'high');
      if (!ok) continue;
    }

    out.push(toNotification(c, ev, world, artists, cities, nowIso, idFactory()));
  }

  // Regras de preço-alvo: avaliadas a cada ciclo.
  const rules = user.rules.map((rule) => {
    if (!rule.active) return rule;
    const ev = events.get(rule.eventId);
    if (!ev) return rule;
    const best = cheapestListing(world.listings, rule.eventId, rule.sectorId, rule.sourceId);
    if (!best || best.price == null || best.price > rule.maxPrice) return rule;
    if (rule.lastTriggeredPrice != null && best.price >= rule.lastTriggeredPrice) return rule;
    const sector = ev.sectors.find((s) => s.id === best.sectorId)?.name ?? '';
    out.push({
      id: idFactory(),
      type: 'target_reached',
      importance: 'high',
      eventId: ev.id,
      artistId: ev.artistIds[0] ?? null,
      sectorId: best.sectorId,
      listingId: best.id,
      title: 'Preço atingido!',
      body: `Encontramos ${shortName(ev, artists)} por ${formatBRL(best.price)}${sector ? ` (${sector})` : ''}. Seu alvo era ${formatBRL(rule.maxPrice)}.`,
      data: { to: best.price },
      createdAt: nowIso,
      read: false,
      cycle: world.cycle,
    });
    return { ...rule, lastTriggeredAt: nowIso, lastTriggeredPrice: best.price };
  });

  return { notifications: out, rules };
}

function shortName(ev: Event, artists: Map<ID, Artist>) {
  return artists.get(ev.artistIds[0])?.name ?? ev.title;
}

function toNotification(
  c: Change,
  ev: Event,
  world: WorldState,
  artists: Map<ID, Artist>,
  cities: Map<ID, City>,
  nowIso: string,
  id: string,
): Notification {
  const sector = c.sectorId ? ev.sectors.find((s) => s.id === c.sectorId)?.name ?? '' : '';
  const listing = c.listingId ? world.listings.find((l) => l.id === c.listingId) : null;
  const cmp = c.comparison;
  const city = cities.get(ev.cityId)?.name ?? '';
  const artist = shortName(ev, artists);
  const n: Notification = {
    id,
    type: c.type,
    importance: c.importance,
    eventId: ev.id,
    artistId: ev.artistIds[0] ?? null,
    sectorId: c.sectorId,
    listingId: c.listingId,
    title: '',
    body: '',
    data: cmp
      ? { from: cmp.previous_price, to: cmp.current_price, difference: cmp.price_difference, percentage: cmp.percentage_change }
      : listing?.price != null
        ? { to: listing.price }
        : {},
    createdAt: nowIso,
    read: false,
    cycle: world.cycle,
  };

  const fromCheapest = () => {
    const best = cheapestListing(world.listings, ev.id);
    return best?.price != null ? ` a partir de ${formatBRL(best.price)}` : '';
  };

  switch (c.type) {
    case 'price_drop':
      n.title = cmp?.new_lowest_price ? 'O preço caiu! Novo menor preço' : 'O preço caiu!';
      n.body = `${sector}: ${formatBRL(cmp!.previous_price)} → ${formatBRL(cmp!.current_price)}. Você economiza ${formatBRL(cmp!.price_difference)}.`;
      break;
    case 'price_increase':
      n.title = 'O preço subiu';
      n.body = `${sector}: ${formatBRL(cmp!.previous_price)} → ${formatBRL(cmp!.current_price)} (${formatPercent(cmp!.percentage_change)}).`;
      break;
    case 'new_lowest':
      n.title = 'Novo menor preço encontrado';
      n.body = `${sector} por ${formatBRL(listing?.price)} — o menor valor que já monitoramos.`;
      break;
    case 'back_in_stock':
      n.title = 'Ingresso disponível novamente';
      n.body = `${sector} voltou a ter ingressos por ${formatBRL(listing?.price)}.`;
      break;
    case 'new_event':
      n.title = 'Novo show anunciado';
      n.body = `${artist} anunciou show em ${city} — ${new Date(ev.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.`;
      break;
    case 'sales_soon':
      n.title = 'Data de vendas definida';
      n.body = ev.salesStartAt
        ? `As vendas começam em ${new Date(ev.salesStartAt).toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
        : 'A data de início das vendas foi divulgada.';
      break;
    case 'sales_open':
      n.title = 'Vendas abertas';
      n.body = `Os ingressos oficiais já estão à venda${fromCheapest()}.`;
      break;
    case 'batch_change':
      n.title = 'Mudança de lote';
      n.body = `${c.batch?.from} → ${c.batch?.to}. Os preços podem ter mudado.`;
      break;
    case 'sold_out':
      n.title = 'Ingressos oficiais esgotados';
      n.body = 'Vamos continuar de olho na revenda para você.';
      break;
    case 'resale_available':
      n.title = 'Revenda disponível';
      n.body = `Encontramos ingressos na revenda${fromCheapest()}.`;
      break;
    case 'target_reached':
      break;
  }
  return n;
}
