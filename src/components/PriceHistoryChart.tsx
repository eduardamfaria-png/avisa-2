import { useEffect, useRef, useState } from 'react';
import { formatBRL } from '../core/format';
import type { PricePoint } from '../core/types';
import { fmtDayMonth } from '../lib/dates';

const H = 200;
const PAD = { top: 16, right: 18, bottom: 26, left: 52 };

/** Histórico de menor preço de um setor. Linha única + crosshair/tooltip + linha do preço-alvo. */
export function PriceHistoryChart({ points, target }: { points: PricePoint[]; target?: number | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length === 0) return <div className="empty">Ainda não há histórico de preço para este setor.</div>;

  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices, target ?? Infinity);
  const hi = Math.max(...prices, target ?? -Infinity);
  const span = hi - lo || hi * 0.1 || 100;
  const yMin = Math.max(0, lo - span * 0.2);
  const yMax = hi + span * 0.2;
  const iw = w - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * ih;
  const ticks = [yMin + (yMax - yMin) * 0.15, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.15];
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join('');
  const area = `${line}L${x(points.length - 1)},${PAD.top + ih}L${x(0)},${PAD.top + ih}Z`;
  const last = points.length - 1;
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor(iw / 70)));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };

  const hp = hover != null ? points[hover] : null;

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      <svg className="chart" width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Histórico de preços">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#7C5CFF" stopOpacity="0.22" />
            <stop offset="1" stopColor="#7C5CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
              {formatBRL(Math.round(t / 10) * 10)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === last ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 && points.length > 1 ? 'start' : i === last && points.length > 1 ? 'end' : 'middle'}>
              {fmtDayMonth(p.at)}
            </text>
          ) : null,
        )}
        {target != null && (
          <g>
            <line x1={PAD.left} x2={w - PAD.right} y1={y(target)} y2={y(target)} stroke="#35D07F" strokeDasharray="5 5" strokeWidth="1.5" />
            <text x={w - PAD.right} y={y(target) - 6} textAnchor="end" style={{ fill: '#35D07F' }}>
              Seu alvo {formatBRL(target)}
            </text>
          </g>
        )}
        <path d={area} fill="url(#area)" />
        <path d={line} fill="none" stroke="#7C5CFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="rgba(255,255,255,.25)" />}
        {points.map((p, i) => (
          <circle key={`d${i}`} cx={x(i)} cy={y(p.price)} r={i === hover || i === last ? 4 : 3} fill={i === last || i === hover ? '#7C5CFF' : '#181824'} stroke="#7C5CFF" strokeWidth="2" />
        ))}
        {hover == null && (
          <text x={x(last)} y={y(points[last].price) - 12} textAnchor={points.length > 1 ? 'end' : 'middle'} style={{ fill: '#fff', fontWeight: 700, fontSize: 12 }}>
            {formatBRL(points[last].price)}
          </text>
        )}
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: x(hover!), top: y(hp.price) }}>
          <b className="num">{formatBRL(hp.price)}</b> <span className="faint">· {new Date(hp.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
        </div>
      )}
    </div>
  );
}
