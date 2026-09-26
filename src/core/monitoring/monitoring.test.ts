import { describe, expect, it } from 'vitest';
import { comparePrices } from './priceChange';
import { runMonitoringCycle } from './runCycle';
import { buildNotifications, type UserMonitoringContext } from './notifications';
import { createDemoWorld } from '../../mocks/world';
import { createMockRegistry } from '../../mocks/sources';
import { artists, cities } from '../../mocks/catalog';
import { DEFAULT_ALERT_SETTINGS } from '../defaults';

describe('comparePrices', () => {
  it('detecta a queda do exemplo principal', () => {
    const c = comparePrices(1590, 1290, 1590);
    expect(c.price_drop).toBe(true);
    expect(c.price_difference).toBe(300);
    expect(c.percentage_change).toBe(-18.87);
    expect(c.new_lowest_price).toBe(true);
  });

  it('aumento não é novo menor preço', () => {
    const c = comparePrices(1290, 1340, 1290);
    expect(c.price_increase).toBe(true);
    expect(c.new_lowest_price).toBe(false);
  });
});

describe('ciclo de monitoramento (mocks)', () => {
  const anchor = new Date('2026-09-26T12:00:00Z');
  const user: UserMonitoringContext = {
    radar: [{ id: 'r1', eventId: 'bts-sp', addedAt: anchor.toISOString(), sectorId: 'pista-premium', maxPrice: 1500, priority: 'alta', alertsEnabled: true }],
    artistPrefs: [
      { artistId: 'henrique-juliano', scope: 'radius', radiusKm: 150, cityIds: [], followedAt: anchor.toISOString() },
    ],
    rules: [{ id: 'p1', eventId: 'bts-sp', sectorId: 'pista-premium', maxPrice: 1500, sourceId: null, active: true, createdAt: anchor.toISOString() }],
    prefs: { homeCityId: 'rj', cityIds: ['rj'], travel: 'brazil', budget: null, alertSettings: DEFAULT_ALERT_SETTINGS },
  };

  it('gera queda, novo menor preço, preço-alvo e novo evento no ciclo 1', async () => {
    const world = createDemoWorld(anchor);
    const now = new Date(anchor.getTime() + 60_000);
    const { world: next, report } = await runMonitoringCycle(createMockRegistry(anchor), world, now);
    expect(next.cycle).toBe(1);

    const drop = report.changes.find((c) => c.eventId === 'bts-sp' && c.type === 'price_drop');
    expect(drop?.comparison).toMatchObject({ previous_price: 1590, current_price: 1290, price_difference: 300, new_lowest_price: true });
    expect(report.changes.some((c) => c.type === 'new_event' && c.eventId === 'hj-rj')).toBe(true);

    let i = 0;
    const { notifications, rules } = buildNotifications(report.changes, next, user, { artists, cities }, now, () => `n${i++}`);
    const types = notifications.map((n) => n.type);
    expect(types).toContain('price_drop');
    expect(types).toContain('target_reached');
    expect(types).toContain('new_event');
    expect(notifications.find((n) => n.type === 'price_drop')?.body).toBe('Pista Premium: R$ 1.590 → R$ 1.290. Você economiza R$ 300.');
    expect(rules[0].lastTriggeredPrice).toBe(1290);

    // Preço-alvo não repete no mesmo valor
    const again = buildNotifications([], next, { ...user, rules }, { artists, cities }, now, () => 'x');
    expect(again.notifications).toHaveLength(0);
  });

  it('percorre o roteiro sem erros e cobre os tipos de mudança', async () => {
    let world = createDemoWorld(anchor);
    const registry = createMockRegistry(anchor);
    const seen = new Set<string>();
    for (let c = 1; c <= 10; c++) {
      const r = await runMonitoringCycle(registry, world, new Date(anchor.getTime() + c * 60_000));
      world = r.world;
      expect(r.report.sourceErrors).toHaveLength(0);
      r.report.changes.forEach((ch) => seen.add(ch.type));
    }
    for (const t of ['price_drop', 'price_increase', 'new_event', 'sales_open', 'batch_change', 'sold_out', 'resale_available', 'back_in_stock']) {
      expect(seen, t).toContain(t);
    }
  });
});
