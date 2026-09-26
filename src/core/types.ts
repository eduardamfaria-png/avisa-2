/**
 * Entidades de domínio do AVISÊ.
 *
 * Este módulo é independente de framework (React, Node, banco). Ele é usado
 * tanto pelo front-end quanto pelo worker de monitoramento em `server/`.
 * O schema relacional equivalente está em `docs/schema.prisma`.
 */

export type ID = string;
export type ISODate = string;

// ───────────────────────── Catálogo ─────────────────────────

export interface City {
  id: ID;
  name: string;
  state: string; // UF ou país
  country: string; // ISO-3166 alpha-2
  lat: number;
  lng: number;
}

export interface Venue {
  id: ID;
  name: string;
  cityId: ID;
  address?: string;
  capacity?: number;
}

export type EventCategory = 'show' | 'festival' | 'teatro' | 'stand-up' | 'esporte';

export interface Artist {
  id: ID;
  slug: string;
  name: string;
  genre: string;
  category: EventCategory;
  hue: number; // cor base para capa gerada
  bio: string;
  followers: number;
  isDemo: boolean;
}

/**
 * Status do evento do ponto de vista do monitoramento.
 * - announced: anunciado, sem data de vendas definida
 * - presale: venda futura (salesStartAt no futuro)
 * - on_sale: venda oficial aberta
 * - sold_out: oficiais esgotados, sem revenda encontrada
 * - resale: oficiais esgotados, com revenda disponível
 */
export type EventStatus = 'announced' | 'presale' | 'on_sale' | 'sold_out' | 'resale';

export interface Sector {
  id: ID;
  name: string;
}

export interface Event {
  id: ID;
  slug: string;
  title: string;
  artistIds: ID[];
  venueId: ID;
  cityId: ID;
  category: EventCategory;
  date: ISODate; // início do evento
  description: string;
  status: EventStatus;
  salesStartAt?: ISODate;
  currentBatch?: string; // "1º lote"
  sectors: Sector[];
  hue: number;
  watchers: number; // pessoas acompanhando
  announcedAt: ISODate;
  updatedAt: ISODate;
  isDemo: boolean;
}

// ───────────────────────── Fontes e ofertas ─────────────────────────

export type TicketSourceKind = 'official' | 'resale';

export interface TicketSource {
  id: ID;
  name: string;
  kind: TicketSourceKind;
  /** Mock = dado fictício gerado localmente. Nunca apresentar como real. */
  isMock: boolean;
  /** Integração autorizada (contrato, API pública com termos compatíveis etc). */
  integration: 'mock' | 'official_api' | 'partner_feed';
  homepage: string;
}

export interface TicketListing {
  id: ID; // `${sourceId}:${eventId}:${sectorId}`
  eventId: ID;
  sectorId: ID;
  sourceId: ID;
  price: number | null; // null = indisponível
  available: boolean;
  batch?: string;
  url: string;
  updatedAt: ISODate;
}

/** Ponto do histórico: menor preço encontrado em um setor em um momento. */
export interface PricePoint {
  eventId: ID;
  sectorId: ID;
  price: number;
  sourceId: ID;
  at: ISODate;
}

// ───────────────────────── Usuário ─────────────────────────

export type TravelPreference = 'near' | 'other_cities' | 'brazil' | 'international';
export type BudgetRange = 'ate_150' | '150_400' | '400_1000' | 'acima_1000';

export interface User {
  id: ID;
  name: string;
  username: string;
  email: string;
  createdAt: ISODate;
  plan: PlanId;
  onboarded: boolean;
}

export type LocationScope = 'my_city' | 'radius' | 'cities' | 'brazil' | 'international';

export interface ArtistPreference {
  artistId: ID;
  scope: LocationScope;
  radiusKm: number;
  cityIds: ID[];
  followedAt: ISODate;
}

export type RadarPriority = 'alta' | 'normal' | 'baixa';

export interface RadarItem {
  id: ID;
  eventId: ID;
  addedAt: ISODate;
  sectorId: ID | null; // null = qualquer setor
  maxPrice: number | null;
  priority: RadarPriority;
  alertsEnabled: boolean;
}

export interface PriceAlertRule {
  id: ID;
  eventId: ID;
  sectorId: ID | null;
  maxPrice: number;
  sourceId: ID | null;
  active: boolean;
  createdAt: ISODate;
  lastTriggeredAt?: ISODate;
  lastTriggeredPrice?: number;
}

export type AlertType =
  | 'new_event'
  | 'sales_soon'
  | 'sales_open'
  | 'price_drop'
  | 'price_increase'
  | 'new_lowest'
  | 'batch_change'
  | 'sold_out'
  | 'back_in_stock'
  | 'resale_available'
  | 'target_reached';

export type AlertLevel = 'always' | 'important' | 'off';

/** Grupos configuráveis pelo usuário (tela Alertas → Configurações). */
export type AlertSettingKey =
  | 'new_events'
  | 'sales_open'
  | 'price_drop'
  | 'price_increase'
  | 'new_lowest'
  | 'batch_change'
  | 'sold_out'
  | 'resale'
  | 'opportunities';

export interface UserPreference {
  homeCityId: ID | null;
  cityIds: ID[];
  travel: TravelPreference;
  budget: BudgetRange | null;
  alertSettings: Record<AlertSettingKey, AlertLevel>;
}

export interface Notification {
  id: ID;
  type: AlertType;
  importance: 'high' | 'normal';
  eventId: ID | null;
  artistId: ID | null;
  sectorId: ID | null;
  listingId: ID | null;
  title: string;
  body: string;
  data: {
    from?: number;
    to?: number;
    difference?: number;
    percentage?: number;
  };
  createdAt: ISODate;
  read: boolean;
  cycle: number;
}

/** Sinais de comportamento para personalização (sempre visíveis/editáveis). */
export interface Behavior {
  clickedEventIds: ID[];
  ignoredEventIds: ID[];
  searchedTerms: string[];
}

// ───────────────────────── Planos (monetização futura) ─────────────────────────

export type PlanId = 'free' | 'premium';

// ───────────────────────── Snapshot do mundo ─────────────────────────

/** Estado "conhecido" pelo AVISÊ sobre eventos e ofertas. */
export interface WorldState {
  cycle: number;
  lastRunAt: ISODate | null;
  events: Event[];
  listings: TicketListing[];
  history: PricePoint[];
}
