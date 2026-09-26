import type { Filters } from '../components/FilterBar';
import { distanceKm } from '../core/location';
import { cheapestListing } from '../core/market';
import type { City, Event, TicketListing } from '../core/types';
import { catalog } from './catalog';
import { isUpcoming } from './recommendations';

const DAY = 86_400_000;
const PERIOD_DAYS = { all: Infinity, week: 7, month: 30, '3months': 92 };

export function applyFilters(events: Event[], f: Filters, listings: TicketListing[], home: City | null, now = new Date()): Event[] {
  return events
    .filter((e) => {
      if (!isUpcoming(e, now)) return false;
      if (f.cityId && e.cityId !== f.cityId) return false;
      if (f.category && e.category !== f.category) return false;
      if (f.status && e.status !== f.status) return false;
      if (f.period !== 'all' && new Date(e.date).getTime() - now.getTime() > PERIOD_DAYS[f.period] * DAY) return false;
      if (f.maxPrice != null) {
        const p = cheapestListing(listings, e.id)?.price;
        if (p == null || p > f.maxPrice) return false;
      }
      if (f.distanceKm != null && home) {
        const c = catalog.city(e.cityId);
        if (!c || distanceKm(home, c) > f.distanceKm) return false;
      }
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
