import type {
  AnySource,
  ArtistSource,
  EventSource,
  ResaleSourceAdapter,
  TicketSourceAdapter,
} from './types';
import type { TicketSource } from '../types';

/** Registro de fontes ativas. Fontes podem ser adicionadas/removidas em tempo de execução. */
export class SourceRegistry {
  private sources = new Map<string, AnySource>();

  register(source: AnySource): this {
    this.sources.set(source.id, source);
    return this;
  }

  unregister(id: string): void {
    this.sources.delete(id);
  }

  all(): AnySource[] {
    return [...this.sources.values()];
  }

  eventSources(): EventSource[] {
    return this.all().filter((s): s is EventSource => s.type === 'event');
  }

  listingSources(): (TicketSourceAdapter | ResaleSourceAdapter)[] {
    return this.all().filter(
      (s): s is TicketSourceAdapter | ResaleSourceAdapter => s.type === 'ticket' || s.type === 'resale',
    );
  }

  artistSources(): ArtistSource[] {
    return this.all().filter((s): s is ArtistSource => s.type === 'artist');
  }

  ticketSourceMeta(): TicketSource[] {
    return this.listingSources().map((s) => s.meta);
  }
}
