import type { PlanId } from './types';

/**
 * Limites por plano. Preparado para monetização futura — nenhum pagamento é
 * processado nesta versão; todos os usuários estão no plano gratuito.
 */
export interface PlanLimits {
  radarItems: number;
  priceRules: number;
  historyDays: number;
  priorityNotifications: boolean;
  advancedFilters: boolean;
}

export const PLANS: Record<PlanId, { name: string; limits: PlanLimits; available: boolean }> = {
  free: {
    name: 'Gratuito',
    available: true,
    limits: { radarItems: 20, priceRules: 5, historyDays: 90, priorityNotifications: false, advancedFilters: true },
  },
  premium: {
    name: 'Premium',
    available: false, // em breve
    limits: { radarItems: 200, priceRules: 100, historyDays: 730, priorityNotifications: true, advancedFilters: true },
  },
};

/**
 * Ponto único de geração de links de saída. Parcerias e afiliados futuros
 * entram aqui (parâmetros de rastreio acordados com cada plataforma).
 */
export function outboundUrl(baseUrl: string, opts: { sourceId: string; userId?: string }): string {
  void opts; // sem parâmetros de afiliado enquanto não houver parceria formal
  return baseUrl;
}
