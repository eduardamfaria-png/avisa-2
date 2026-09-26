/**
 * ⚠️ CONTA DE DEMONSTRAÇÃO — preferências e alertas fictícios para testar o produto.
 * Não representam preferências reais de nenhuma pessoa.
 */
import { defaultPreferences } from '../core/defaults';
import type { Notification, User } from '../core/types';
import type { Account, UserData } from '../repositories/storage';

const DAY = 86_400_000;

export const DEMO_EMAIL = 'demo@avise.app';

export function createDemoAccount(anchor: Date): { account: Account; data: UserData } {
  const iso = (daysAgo: number) => new Date(anchor.getTime() - daysAgo * DAY).toISOString();
  const user: User = {
    id: 'demo-user',
    name: 'Eduarda',
    username: 'eduarda',
    email: DEMO_EMAIL,
    createdAt: iso(40),
    plan: 'free',
    onboarded: true,
  };
  const prefs = defaultPreferences();
  prefs.homeCityId = 'rj';
  prefs.cityIds = ['rj', 'sp'];
  prefs.travel = 'international';
  prefs.budget = '400_1000';

  const past = (
    id: string,
    type: Notification['type'],
    eventId: string,
    title: string,
    body: string,
    daysAgo: number,
    data: Notification['data'] = {},
  ): Notification => ({
    id,
    type,
    importance: 'high',
    eventId,
    artistId: null,
    sectorId: type === 'price_drop' ? 'pista-premium' : null,
    listingId: null,
    title,
    body,
    data,
    createdAt: iso(daysAgo),
    read: true,
    cycle: 0,
  });

  return {
    account: { user, passwordHash: 'demo' },
    data: {
      prefs,
      artistPrefs: [
        { artistId: 'bts', scope: 'international', radiusKm: 100, cityIds: [], followedAt: iso(30) },
        { artistId: 'henrique-juliano', scope: 'radius', radiusKm: 150, cityIds: [], followedAt: iso(25) },
        { artistId: 'taylor-swift', scope: 'brazil', radiusKm: 100, cityIds: [], followedAt: iso(20) },
        { artistId: 'coldplay', scope: 'cities', radiusKm: 100, cityIds: ['sp', 'rj'], followedAt: iso(18) },
      ],
      radar: [
        { id: 'r-bts-sp', eventId: 'bts-sp', addedAt: iso(28), sectorId: 'pista-premium', maxPrice: 1500, priority: 'alta', alertsEnabled: true },
        { id: 'r-alvorada', eventId: 'festival-alvorada', addedAt: iso(10), sectorId: 'passe-2', maxPrice: 700, priority: 'normal', alertsEnabled: true },
        { id: 'r-coldplay', eventId: 'coldplay-sp', addedAt: iso(15), sectorId: null, maxPrice: null, priority: 'normal', alertsEnabled: true },
        { id: 'r-hj-bh', eventId: 'hj-bh', addedAt: iso(6), sectorId: 'pista', maxPrice: null, priority: 'baixa', alertsEnabled: true },
      ],
      rules: [
        { id: 'radar-bts-sp', eventId: 'bts-sp', sectorId: 'pista-premium', maxPrice: 1500, sourceId: null, active: true, createdAt: iso(28) },
        { id: 'radar-festival-alvorada', eventId: 'festival-alvorada', sectorId: 'passe-2', maxPrice: 700, sourceId: null, active: true, createdAt: iso(10) },
      ],
      notifications: [
        past('past-1', 'price_drop', 'bts-sp', 'O preço caiu!', 'Pista Premium: R$ 1.700 → R$ 1.590. Você economiza R$ 110.', 0.2, { from: 1700, to: 1590, difference: 110, percentage: -6.47 }),
        past('past-2', 'batch_change', 'coldplay-sp', 'Mudança de lote', '2º lote → 3º lote. Os preços podem ter mudado.', 2),
        past('past-3', 'sales_soon', 'festival-alvorada', 'Data de vendas definida', 'As vendas começam em 2 dias, às 10h.', 5),
        past('past-4', 'sold_out', 'bts-sp', 'Ingressos oficiais esgotados', 'Vamos continuar de olho na revenda para você.', 21),
      ],
      behavior: { clickedEventIds: [], ignoredEventIds: [], searchedTerms: [] },
      outboundClicks: [],
    },
  };
}
