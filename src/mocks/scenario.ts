/**
 * ⚠️ DADOS DE DEMONSTRAÇÃO — roteiro da simulação de monitoramento.
 *
 * Cada passo descreve o que as fontes fictícias "passam a mostrar" a partir
 * de um ciclo. Serve para demonstrar, de forma previsível, todos os tipos de
 * alerta do AVISÊ. Depois do último passo de cada setor, os preços de revenda
 * seguem uma variação pseudoaleatória determinística.
 */
import type { EventStatus } from '../core/types';

export interface ScenarioStep {
  cycle: number;
  eventId: string;
  status?: EventStatus;
  batch?: string;
  official?: Record<string, number | null>;
  resale?: Record<string, number | null>;
  note: string;
}

export const scenario: ScenarioStep[] = [
  // Ciclo 1 — o exemplo principal: BTS Pista Premium cai de R$ 1.590 para R$ 1.290.
  { cycle: 1, eventId: 'bts-sp', resale: { 'pista-premium': 1290 }, note: 'Queda de preço + novo menor preço + preço-alvo' },
  { cycle: 1, eventId: 'hj-rj', note: 'Novo show anunciado (Henrique & Juliano no Rio)' },

  // Ciclo 2
  { cycle: 2, eventId: 'bts-rj', resale: { 'pista-premium': 1690, pista: 1400, 'cadeira-inf': 1150, 'cadeira-sup': 890 }, note: 'Revenda encontrada para evento esgotado' },
  { cycle: 2, eventId: 'hj-bh', batch: '3º lote', official: { pista: 210, frontstage: 320, camarote: 460 }, note: 'Mudança de lote (preço sobe)' },
  { cycle: 2, eventId: 'bts-sp', resale: { 'pista-premium': 1340 }, note: 'Pequeno aumento' },

  // Ciclo 3
  { cycle: 3, eventId: 'festival-alvorada', status: 'on_sale', official: { 'passe-1': 390, 'passe-2': 690, vip: 1190 }, note: 'Abertura de vendas' },
  { cycle: 3, eventId: 'taylor-sp', note: 'Novo show anunciado (Taylor Swift)' },
  { cycle: 3, eventId: 'bts-sp', resale: { pista: 990 }, note: 'Queda na Pista' },

  // Ciclo 4
  { cycle: 4, eventId: 'coldplay-sp', status: 'resale', official: { 'pista-premium': null, pista: null, 'cadeira-inf': null, 'cadeira-sup': null }, resale: { 'pista-premium': 1650, pista: 980, 'cadeira-inf': 790, 'cadeira-sup': 560 }, note: 'Esgotado + revenda' },
  { cycle: 4, eventId: 'bts-sp', resale: { 'pista-premium': 1250 }, note: 'Novo menor preço' },

  // Ciclo 5
  { cycle: 5, eventId: 'hj-rj', status: 'on_sale', official: { pista: 160, frontstage: 260, camarote: 380 }, note: 'Vendas abertas' },
  { cycle: 5, eventId: 'coldplay-sp', resale: { 'pista-premium': 1480 }, note: 'Queda na revenda' },

  // Ciclo 6
  { cycle: 6, eventId: 'bts-sp', resale: { 'cadeira-sup': 690 }, note: 'Ingresso disponível novamente' },
  { cycle: 6, eventId: 'ivete-ssa', status: 'on_sale', official: { pista: 150, frontstage: 250, camarote: 390 }, note: 'Vendas abertas' },

  // Ciclo 7
  { cycle: 7, eventId: 'festival-alvorada', batch: '2º lote', official: { 'passe-1': 450, 'passe-2': 790, vip: 1290 }, note: 'Mudança de lote' },
  { cycle: 7, eventId: 'bts-sp', resale: { 'pista-premium': 1190 }, note: 'Novo menor preço' },

  // Ciclo 8
  { cycle: 8, eventId: 'anitta-ssa', status: 'sold_out', official: { pista: null, frontstage: null, camarote: null }, note: 'Esgotado' },
  { cycle: 9, eventId: 'anitta-ssa', resale: { pista: 260, frontstage: 380, camarote: 520 }, note: 'Revenda encontrada' },
];
