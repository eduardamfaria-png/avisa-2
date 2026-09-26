const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function formatBRL(value: number | null | undefined): string {
  if (value == null) return '—';
  // Intl usa espaço não separável; mantemos "R$ 1.290".
  return brl.format(value).replace(/ /g, ' ');
}

export function formatPercent(value: number, digits = 0): string {
  const abs = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${value < 0 ? '-' : value > 0 ? '+' : ''}${abs}%`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
