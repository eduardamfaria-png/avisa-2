import type { ArtistPreference, City, ID, LocationScope } from './types';

export function distanceKm(a: City, b: City): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

/** O evento nesta cidade está dentro da área que o usuário escolheu para o artista? */
export function isInScope(
  pref: Pick<ArtistPreference, 'scope' | 'radiusKm' | 'cityIds'>,
  eventCity: City,
  homeCity: City | null,
): boolean {
  switch (pref.scope) {
    case 'international':
      return true;
    case 'brazil':
      return eventCity.country === 'BR';
    case 'cities':
      return pref.cityIds.includes(eventCity.id) || (homeCity?.id === eventCity.id);
    case 'my_city':
      return homeCity?.id === eventCity.id;
    case 'radius':
      return homeCity ? distanceKm(homeCity, eventCity) <= pref.radiusKm : false;
  }
}

export const SCOPE_LABEL: Record<LocationScope, string> = {
  my_city: 'Somente minha cidade',
  radius: 'Até X km',
  cities: 'Cidades específicas',
  brazil: 'Qualquer cidade do Brasil',
  international: 'Internacional',
};

export function describeScope(
  pref: Pick<ArtistPreference, 'scope' | 'radiusKm' | 'cityIds'>,
  cityName: (id: ID) => string,
  homeCityName?: string,
): string {
  switch (pref.scope) {
    case 'my_city':
      return homeCityName ? `Somente ${homeCityName}` : 'Somente minha cidade';
    case 'radius':
      return `Até ${pref.radiusKm} km${homeCityName ? ` de ${homeCityName}` : ''}`;
    case 'cities':
      return pref.cityIds.length ? pref.cityIds.map(cityName).join(' + ') : 'Cidades específicas';
    case 'brazil':
      return 'Brasil inteiro';
    case 'international':
      return 'Brasil inteiro + internacional';
  }
}
