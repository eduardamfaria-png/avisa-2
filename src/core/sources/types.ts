import type { Artist, Event, ID, TicketListing, TicketSource } from '../types';

/**
 * Camada modular de fontes.
 *
 * Cada integração implementa uma (ou mais) destas interfaces e é registrada
 * no `SourceRegistry`. O motor de monitoramento só conhece as interfaces —
 * adicionar ou remover uma plataforma não exige mudar o motor.
 *
 * IMPORTANTE: uma fonte só deve ser registrada em produção quando a coleta
 * for técnica e legalmente permitida (API oficial, contrato de parceria,
 * feed autorizado). Veja `docs/ARQUITETURA.md`.
 */

export interface SourceContext {
  cycle: number;
  now: Date;
  /** Eventos já conhecidos (para fontes que atualizam status). */
  knownEvents: Event[];
}

interface BaseSource {
  readonly id: ID;
  readonly name: string;
  /** Fonte fictícia, usada apenas para demonstração. */
  readonly isMock: boolean;
}

/** Descobre eventos novos e atualiza status (anúncio, abertura de vendas, lote, esgotado). */
export interface EventSource extends BaseSource {
  readonly type: 'event';
  fetchEvents(ctx: SourceContext): Promise<EventUpdate[]>;
}

/** Retorna ofertas de ingressos oficiais. */
export interface TicketSourceAdapter extends BaseSource {
  readonly type: 'ticket';
  readonly meta: TicketSource;
  fetchListings(ctx: SourceContext): Promise<TicketListing[]>;
}

/** Retorna ofertas de revenda. Mesmo contrato do TicketSource, separado por semântica e política. */
export interface ResaleSourceAdapter extends BaseSource {
  readonly type: 'resale';
  readonly meta: TicketSource;
  fetchListings(ctx: SourceContext): Promise<TicketListing[]>;
}

/** Informações sobre artistas (metadados, agenda anunciada). */
export interface ArtistSource extends BaseSource {
  readonly type: 'artist';
  fetchArtists(ctx: SourceContext): Promise<Artist[]>;
}

export type AnySource = EventSource | TicketSourceAdapter | ResaleSourceAdapter | ArtistSource;

/** Novo evento completo ou alteração parcial de um existente. */
export type EventUpdate =
  | { kind: 'new'; event: Event }
  | { kind: 'patch'; eventId: ID; patch: Partial<Pick<Event, 'status' | 'salesStartAt' | 'currentBatch' | 'watchers'>> };
