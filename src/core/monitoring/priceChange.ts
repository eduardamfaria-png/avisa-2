import { round2 } from '../format';

export interface PriceComparison {
  previous_price: number;
  current_price: number;
  price_drop: boolean;
  price_increase: boolean;
  /** Diferença absoluta em reais. */
  price_difference: number;
  /** Variação percentual com sinal, 2 casas (ex.: -18.87). */
  percentage_change: number;
  /** Menor preço já monitorado ANTES desta leitura. */
  previous_lowest: number | null;
  new_lowest_price: boolean;
}

/**
 * Compara o preço anterior com o atual e com o menor preço histórico.
 *
 * Ex.: 1590 → 1290 com histórico mínimo 1590
 *   → price_drop = true, price_difference = 300,
 *     percentage_change = -18.87, new_lowest_price = true
 */
export function comparePrices(
  previous: number,
  current: number,
  historicLowest: number | null,
): PriceComparison {
  const diff = current - previous;
  return {
    previous_price: previous,
    current_price: current,
    price_drop: diff < 0,
    price_increase: diff > 0,
    price_difference: Math.abs(diff),
    percentage_change: previous === 0 ? 0 : round2((diff / previous) * 100),
    previous_lowest: historicLowest,
    new_lowest_price: historicLowest == null ? false : current < historicLowest,
  };
}

/** Quedas a partir deste percentual (ou que batem o mínimo histórico) são "importantes". */
export const IMPORTANT_DROP_PERCENT = 10;

export function isImportantDrop(c: PriceComparison): boolean {
  return c.price_drop && (c.new_lowest_price || Math.abs(c.percentage_change) >= IMPORTANT_DROP_PERCENT);
}
