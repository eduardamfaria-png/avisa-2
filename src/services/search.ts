import { normalize } from '../core/format';
import type { Artist, City, Event, EventCategory, Venue } from '../core/types';
import { catalog } from './catalog';

export interface SearchResults {
  artists: Artist[];
  events: Event[];
  venues: Venue[];
  cities: City[];
  categories: EventCategory[];
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  show: 'Shows',
  festival: 'Festivais',
  teatro: 'Teatro',
  'stand-up': 'Stand-up',
  esporte: 'Esportes',
};

const CATEGORY_TERMS: Record<EventCategory, string[]> = {
  show: ['show', 'shows', 'concerto'],
  festival: ['festival', 'festivais'],
  teatro: ['teatro'],
  'stand-up': ['stand-up', 'standup', 'stand up', 'comedia', 'humor'],
  esporte: ['esporte', 'esportes', 'jogo'],
};

/** Busca global: artista, evento, festival, local, cidade e categoria. */
export function search(query: string, events: Event[]): SearchResults {
  const q = normalize(query);
  if (!q) return { artists: [], events: [], venues: [], cities: [], categories: [] };
  const has = (text: string) => normalize(text).includes(q);

  const artists = catalog.artists.filter((a) => has(a.name) || has(a.genre));
  const cities = catalog.cities.filter((c) => has(c.name) || normalize(c.state) === q);
  const venues = catalog.venues.filter((v) => has(v.name));
  const categories = (Object.keys(CATEGORY_TERMS) as EventCategory[]).filter((c) =>
    CATEGORY_TERMS[c].some((t) => t.startsWith(q) || q.startsWith(t)),
  );

  const artistIds = new Set(artists.map((a) => a.id));
  const cityIds = new Set(cities.map((c) => c.id));
  const venueIds = new Set(venues.map((v) => v.id));
  const matched = events.filter(
    (e) =>
      has(e.title) ||
      e.artistIds.some((id) => artistIds.has(id)) ||
      cityIds.has(e.cityId) ||
      venueIds.has(e.venueId) ||
      categories.includes(e.category),
  );
  matched.sort((a, b) => a.date.localeCompare(b.date));
  return { artists, events: matched, venues, cities, categories };
}
