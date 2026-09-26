/**
 * Acesso ao catálogo estático (artistas, cidades, locais, fontes).
 * Hoje lê os mocks; amanhã pode ler de uma API sem mudar os consumidores.
 */
import type { Artist, City, Event, ID, TicketSource, Venue } from '../core/types';
import { artists, cities, venues } from '../mocks/catalog';
import { MOCK_TICKET_SOURCES } from '../mocks/sources';

const artistMap = new Map(artists.map((a) => [a.id, a]));
const cityMap = new Map(cities.map((c) => [c.id, c]));
const venueMap = new Map(venues.map((v) => [v.id, v]));
const sourceMap = new Map(MOCK_TICKET_SOURCES.map((s) => [s.id, s]));

export const catalog = {
  artists,
  cities,
  venues,
  sources: MOCK_TICKET_SOURCES,
  artist: (id: ID): Artist | undefined => artistMap.get(id),
  city: (id: ID | null | undefined): City | undefined => (id ? cityMap.get(id) : undefined),
  venue: (id: ID): Venue | undefined => venueMap.get(id),
  source: (id: ID): TicketSource | undefined => sourceMap.get(id),
  cityName: (id: ID) => cityMap.get(id)?.name ?? id,
  eventArtists: (ev: Event): Artist[] => ev.artistIds.map((id) => artistMap.get(id)).filter(Boolean) as Artist[],
  mainArtist: (ev: Event): Artist | undefined => artistMap.get(ev.artistIds[0]),
  /** Nome curto para exibição: festival usa o próprio nome; show usa o artista principal. */
  eventLabel: (ev: Event): string => (ev.category === 'festival' ? ev.title : artistMap.get(ev.artistIds[0])?.name ?? ev.title),
};
