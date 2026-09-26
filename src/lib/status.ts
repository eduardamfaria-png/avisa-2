import { priceStats, type PriceStats } from '../core/market';
import type { AlertType, Event, ID, PricePoint, TicketListing } from '../core/types';
import { daysUntil, fmtTime } from './dates';

export type Tone = 'green' | 'red' | 'yellow' | 'purple' | 'blue' | 'neutral';

export interface StatusInfo {
  label: string;
  tone: Tone;
  live?: boolean;
  cta: string;
  showCountdown: boolean;
}

export function eventStatus(ev: Event, now = new Date()): StatusInfo {
  switch (ev.status) {
    case 'announced':
      return { label: 'Evento anunciado', tone: 'blue', cta: 'Ver detalhes', showCountdown: false };
    case 'presale': {
      if (!ev.salesStartAt) return { label: 'Venda futura', tone: 'yellow', cta: 'Ver detalhes', showCountdown: false };
      const d = daysUntil(ev.salesStartAt, now);
      const label =
        d <= 0 ? `Vendas começam hoje às ${fmtTime(ev.salesStartAt)}` : d === 1 ? `Vendas abrem amanhã às ${fmtTime(ev.salesStartAt)}` : `Vendas abrem em ${d} dias`;
      return { label, tone: 'yellow', cta: 'Ver detalhes', showCountdown: true };
    }
    case 'on_sale':
      return { label: 'Vendas abertas', tone: 'green', live: true, cta: 'Comprar ingresso', showCountdown: false };
    case 'sold_out':
      return { label: 'Ingressos oficiais esgotados', tone: 'red', cta: 'Ver detalhes', showCountdown: false };
    case 'resale':
      return { label: 'Revenda disponível', tone: 'purple', live: true, cta: 'Ver ingressos', showCountdown: false };
  }
}

export interface PriceSignal {
  kind: 'drop' | 'lowest' | 'rise';
  label: string;
}

export function priceSignal(s: PriceStats): PriceSignal | null {
  if (s.change == null || s.change === 0) return null;
  if (s.change < 0) {
    const isLowest = s.current != null && s.lowest != null && s.current <= s.lowest && s.points.length >= 2;
    return isLowest ? { kind: 'lowest', label: 'Novo menor preço' } : { kind: 'drop', label: 'Preço caiu' };
  }
  return { kind: 'rise', label: 'Preço subiu' };
}

export function statsFor(listings: TicketListing[], history: PricePoint[], eventId: ID, sectorId: ID | null) {
  return priceStats(listings, history, eventId, sectorId);
}

export const ALERT_META: Record<AlertType, { emoji: string; tone: Tone; label: string }> = {
  price_drop: { emoji: '🔔', tone: 'green', label: 'Queda de preço' },
  new_lowest: { emoji: '🔥', tone: 'green', label: 'Novo menor preço' },
  target_reached: { emoji: '🎯', tone: 'green', label: 'Preço-alvo' },
  price_increase: { emoji: '📈', tone: 'red', label: 'Aumento de preço' },
  new_event: { emoji: '🎟️', tone: 'purple', label: 'Novo evento' },
  sales_soon: { emoji: '🗓️', tone: 'yellow', label: 'Venda futura' },
  sales_open: { emoji: '⏰', tone: 'yellow', label: 'Abertura de vendas' },
  batch_change: { emoji: '🔁', tone: 'yellow', label: 'Mudança de lote' },
  sold_out: { emoji: '⚠️', tone: 'red', label: 'Esgotado' },
  back_in_stock: { emoji: '✨', tone: 'green', label: 'Disponível novamente' },
  resale_available: { emoji: '🎫', tone: 'purple', label: 'Revenda' },
};

export const ALERT_FILTERS: { id: string; label: string; types: AlertType[] }[] = [
  { id: 'all', label: 'Todos', types: [] },
  { id: 'price', label: 'Preço', types: ['price_drop', 'new_lowest', 'target_reached', 'price_increase', 'back_in_stock'] },
  { id: 'sales', label: 'Vendas', types: ['sales_soon', 'sales_open', 'batch_change', 'sold_out', 'resale_available'] },
  { id: 'events', label: 'Novos eventos', types: ['new_event'] },
];
