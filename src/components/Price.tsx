import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatBRL } from '../core/format';

export function PriceDelta({ change }: { change: number | null }) {
  if (change == null || change === 0) return null;
  const down = change < 0;
  return (
    <span className={`delta ${down ? 'delta--down' : 'delta--up'}`}>
      {down ? <ArrowDown size={13} strokeWidth={3} /> : <ArrowUp size={13} strokeWidth={3} />}
      {formatBRL(Math.abs(change))}
    </span>
  );
}

export function PriceFlow({ from, to }: { from: number; to: number }) {
  return (
    <span className="price-flow">
      <s>{formatBRL(from)}</s>
      <span aria-hidden>→</span>
      <span className={to < from ? 'to' : ''} style={to > from ? { color: 'var(--red)' } : undefined}>
        {formatBRL(to)}
      </span>
    </span>
  );
}
