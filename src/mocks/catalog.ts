/**
 * ⚠️ DADOS DE DEMONSTRAÇÃO
 *
 * Nomes de artistas são usados apenas como exemplo. Todos os eventos, locais,
 * datas, preços e fontes abaixo são FICTÍCIOS e não representam agendas,
 * valores ou disponibilidade reais. A interface sinaliza isso ao usuário.
 */
import type { Artist, City, EventCategory, EventStatus, Sector, Venue } from '../core/types';

export const cities: City[] = [
  { id: 'sp', name: 'São Paulo', state: 'SP', country: 'BR', lat: -23.55, lng: -46.63 },
  { id: 'rj', name: 'Rio de Janeiro', state: 'RJ', country: 'BR', lat: -22.91, lng: -43.17 },
  { id: 'nit', name: 'Niterói', state: 'RJ', country: 'BR', lat: -22.88, lng: -43.1 },
  { id: 'cps', name: 'Campinas', state: 'SP', country: 'BR', lat: -22.9, lng: -47.06 },
  { id: 'bh', name: 'Belo Horizonte', state: 'MG', country: 'BR', lat: -19.92, lng: -43.94 },
  { id: 'ssa', name: 'Salvador', state: 'BA', country: 'BR', lat: -12.97, lng: -38.5 },
  { id: 'cwb', name: 'Curitiba', state: 'PR', country: 'BR', lat: -25.43, lng: -49.27 },
  { id: 'poa', name: 'Porto Alegre', state: 'RS', country: 'BR', lat: -30.03, lng: -51.23 },
  { id: 'gyn', name: 'Goiânia', state: 'GO', country: 'BR', lat: -16.68, lng: -49.25 },
  { id: 'rec', name: 'Recife', state: 'PE', country: 'BR', lat: -8.05, lng: -34.88 },
  { id: 'bsb', name: 'Brasília', state: 'DF', country: 'BR', lat: -15.79, lng: -47.88 },
  { id: 'lis', name: 'Lisboa', state: 'Portugal', country: 'PT', lat: 38.72, lng: -9.14 },
];

export const venues: Venue[] = [
  { id: 'estadio-central-sp', name: 'Estádio Central', cityId: 'sp', capacity: 60000 },
  { id: 'arena-paulista', name: 'Arena Paulista', cityId: 'sp', capacity: 15000 },
  { id: 'parque-varzea', name: 'Parque da Várzea', cityId: 'sp', capacity: 40000 },
  { id: 'estadio-maravilha', name: 'Estádio Maravilha', cityId: 'rj', capacity: 70000 },
  { id: 'arena-barra', name: 'Arena Barra', cityId: 'rj', capacity: 14000 },
  { id: 'arena-gerais', name: 'Arena das Gerais', cityId: 'bh', capacity: 18000 },
  { id: 'teatro-sabara', name: 'Teatro Sabará', cityId: 'bh', capacity: 1800 },
  { id: 'arena-fonte', name: 'Arena Fonte Nova Demo', cityId: 'ssa', capacity: 20000 },
  { id: 'concha-farol', name: 'Concha do Farol', cityId: 'ssa', capacity: 8000 },
  { id: 'arena-araucaria', name: 'Arena Araucária', cityId: 'cwb', capacity: 25000 },
  { id: 'teatro-guaiba', name: 'Teatro Guaíba', cityId: 'poa', capacity: 2200 },
  { id: 'arena-cerrado', name: 'Arena Cerrado', cityId: 'gyn', capacity: 30000 },
  { id: 'arena-tejo', name: 'Arena Tejo', cityId: 'lis', capacity: 20000 },
];

const a = (
  id: string,
  name: string,
  genre: string,
  category: EventCategory,
  hue: number,
  followers: number,
  bio: string,
): Artist => ({ id, slug: id, name, genre, category, hue, followers, bio, isDemo: true });

export const artists: Artist[] = [
  a('bts', 'BTS', 'K-pop', 'show', 268, 48210, 'Grupo sul-coreano de K-pop.'),
  a('henrique-juliano', 'Henrique & Juliano', 'Sertanejo', 'show', 28, 31980, 'Dupla sertaneja brasileira.'),
  a('coldplay', 'Coldplay', 'Pop rock', 'show', 190, 29450, 'Banda britânica de pop rock.'),
  a('taylor-swift', 'Taylor Swift', 'Pop', 'show', 330, 41200, 'Cantora e compositora norte-americana.'),
  a('anitta', 'Anitta', 'Pop / Funk', 'show', 345, 27800, 'Cantora brasileira de pop e funk.'),
  a('ludmilla', 'Ludmilla', 'Funk / Pagode', 'show', 300, 15400, 'Cantora brasileira de funk e pagode.'),
  a('matue', 'Matuê', 'Trap', 'show', 150, 17300, 'Rapper brasileiro de trap.'),
  a('ivete-sangalo', 'Ivete Sangalo', 'Axé', 'show', 45, 22100, 'Cantora brasileira de axé e pop.'),
  a('jorge-mateus', 'Jorge & Mateus', 'Sertanejo', 'show', 12, 19870, 'Dupla sertaneja brasileira.'),
  a('iron-maiden', 'Iron Maiden', 'Heavy metal', 'show', 0, 13900, 'Banda britânica de heavy metal.'),
  a('marisa-monte', 'Marisa Monte', 'MPB', 'show', 170, 11200, 'Cantora e compositora brasileira de MPB.'),
  a('imagine-dragons', 'Imagine Dragons', 'Pop rock', 'show', 210, 12600, 'Banda norte-americana de pop rock.'),
  a('riso-solto', 'Coletivo Riso Solto', 'Stand-up', 'stand-up', 55, 3200, 'Coletivo fictício de comediantes, criado para esta demonstração.'),
];

// ───────────── Setores ─────────────

const S = (id: string, name: string): Sector => ({ id, name });
export const SECTORS = {
  stadium: [S('pista-premium', 'Pista Premium'), S('pista', 'Pista'), S('cadeira-inf', 'Cadeira Inferior'), S('cadeira-sup', 'Cadeira Superior')],
  arena: [S('pista', 'Pista'), S('frontstage', 'Frontstage'), S('camarote', 'Camarote')],
  festival: [S('passe-1', 'Passe 1 dia'), S('passe-2', 'Passe 2 dias'), S('vip', 'Passe VIP')],
  teatro: [S('plateia', 'Plateia'), S('plateia-sup', 'Plateia Superior'), S('balcao', 'Balcão')],
};

// ───────────── Eventos (sementes) ─────────────

/** Preços por fonte/setor. Arrays = histórico (mais antigo → atual). null = indisponível. */
export type SectorPrices = Record<string, number[] | null>;

export interface EventSeed {
  id: string;
  title: string;
  artistIds: string[];
  venueId: string;
  category: EventCategory;
  dayOffset: number;
  hour: number;
  status: EventStatus;
  salesInDays?: number;
  batch?: string;
  sectors: Sector[];
  watchers: number;
  description: string;
  official?: SectorPrices;
  resale?: SectorPrices;
  /** Evento ainda não conhecido: anunciado pela fonte neste ciclo. */
  announceAtCycle?: number;
}

export const eventSeeds: EventSeed[] = [
  {
    id: 'bts-sp',
    title: 'BTS — São Paulo',
    artistIds: ['bts'],
    venueId: 'estadio-central-sp',
    category: 'show',
    dayOffset: 22,
    hour: 20,
    status: 'resale',
    sectors: SECTORS.stadium,
    watchers: 18432,
    description: 'Show de estádio com produção completa. Ingressos oficiais esgotados em minutos — o AVISÊ acompanha a revenda por setor.',
    resale: {
      'pista-premium': [1850, 1790, 1700, 1590],
      pista: [1190, 1150, 1120, 1090],
      'cadeira-inf': [980, 950, 990, 940],
      'cadeira-sup': null,
    },
  },
  {
    id: 'bts-rj',
    title: 'BTS — Rio de Janeiro',
    artistIds: ['bts'],
    venueId: 'estadio-maravilha',
    category: 'show',
    dayOffset: 26,
    hour: 20,
    status: 'sold_out',
    sectors: SECTORS.stadium,
    watchers: 12880,
    description: 'Segunda data no Brasil. Ingressos oficiais esgotados; ainda sem ofertas de revenda encontradas.',
  },
  {
    id: 'hj-rj',
    title: 'Henrique & Juliano — Rio de Janeiro',
    artistIds: ['henrique-juliano'],
    venueId: 'arena-barra',
    category: 'show',
    dayOffset: 45,
    hour: 22,
    status: 'presale',
    salesInDays: 5,
    batch: '1º lote',
    sectors: SECTORS.arena,
    watchers: 4210,
    description: 'Nova data no Rio anunciada. Vendas oficiais começam em breve.',
    announceAtCycle: 1,
  },
  {
    id: 'hj-bh',
    title: 'Henrique & Juliano — Belo Horizonte',
    artistIds: ['henrique-juliano'],
    venueId: 'arena-gerais',
    category: 'show',
    dayOffset: 12,
    hour: 22,
    status: 'on_sale',
    batch: '2º lote',
    sectors: SECTORS.arena,
    watchers: 6120,
    description: 'Turnê nacional com repertório de sucessos. Vendas em lotes — o preço sobe a cada virada.',
    official: { pista: [150, 180], frontstage: [260, 290], camarote: [380, 420] },
  },
  {
    id: 'festival-alvorada',
    title: 'Festival Alvorada',
    artistIds: ['anitta', 'ludmilla', 'matue'],
    venueId: 'parque-varzea',
    category: 'festival',
    dayOffset: 34,
    hour: 14,
    status: 'presale',
    salesInDays: 2,
    batch: '1º lote',
    sectors: SECTORS.festival,
    watchers: 9340,
    description: 'Festival fictício de dois dias com pop, funk e trap. Line-up de demonstração.',
  },
  {
    id: 'coldplay-sp',
    title: 'Coldplay — São Paulo',
    artistIds: ['coldplay'],
    venueId: 'estadio-central-sp',
    category: 'show',
    dayOffset: 58,
    hour: 20,
    status: 'on_sale',
    batch: '3º lote',
    sectors: SECTORS.stadium,
    watchers: 15670,
    description: 'Turnê de estádios. Últimos lotes oficiais disponíveis.',
    official: { 'pista-premium': [990, 1100], pista: [590, 650], 'cadeira-inf': [480, 520], 'cadeira-sup': [340, 380] },
  },
  {
    id: 'taylor-sp',
    title: 'Taylor Swift — São Paulo',
    artistIds: ['taylor-swift'],
    venueId: 'estadio-central-sp',
    category: 'show',
    dayOffset: 90,
    hour: 19,
    status: 'announced',
    sectors: SECTORS.stadium,
    watchers: 21000,
    description: 'Show anunciado. Datas de venda ainda não divulgadas.',
    announceAtCycle: 3,
  },
  {
    id: 'anitta-ssa',
    title: 'Anitta — Salvador',
    artistIds: ['anitta'],
    venueId: 'arena-fonte',
    category: 'show',
    dayOffset: 9,
    hour: 22,
    status: 'on_sale',
    batch: 'Lote final',
    sectors: SECTORS.arena,
    watchers: 5230,
    description: 'Show com convidados especiais. Lote final à venda.',
    official: { pista: [120, 140], frontstage: [200, 220], camarote: [300, 320] },
  },
  {
    id: 'ivete-ssa',
    title: 'Ivete Sangalo — Salvador',
    artistIds: ['ivete-sangalo'],
    venueId: 'concha-farol',
    category: 'show',
    dayOffset: 40,
    hour: 21,
    status: 'presale',
    salesInDays: 3,
    batch: '1º lote',
    sectors: SECTORS.arena,
    watchers: 7010,
    description: 'Show especial ao ar livre. Vendas abrem em breve.',
  },
  {
    id: 'matue-cwb',
    title: 'Matuê — Curitiba',
    artistIds: ['matue'],
    venueId: 'arena-araucaria',
    category: 'show',
    dayOffset: 16,
    hour: 21,
    status: 'on_sale',
    batch: '1º lote',
    sectors: SECTORS.arena,
    watchers: 3880,
    description: 'Turnê nacional de trap.',
    official: { pista: [110], frontstage: [190], camarote: [290] },
  },
  {
    id: 'iron-maiden-sp',
    title: 'Iron Maiden — São Paulo',
    artistIds: ['iron-maiden'],
    venueId: 'arena-paulista',
    category: 'show',
    dayOffset: 5,
    hour: 20,
    status: 'resale',
    sectors: SECTORS.arena,
    watchers: 4410,
    description: 'Oficiais esgotados. Revenda ativa.',
    resale: { pista: [760, 720, 690], frontstage: [1090, 990], camarote: [640, 590] },
  },
  {
    id: 'marisa-poa',
    title: 'Marisa Monte — Porto Alegre',
    artistIds: ['marisa-monte'],
    venueId: 'teatro-guaiba',
    category: 'teatro',
    dayOffset: 20,
    hour: 21,
    status: 'on_sale',
    batch: '1º lote',
    sectors: SECTORS.teatro,
    watchers: 1980,
    description: 'Apresentação intimista em teatro.',
    official: { plateia: [280], 'plateia-sup': [220], balcao: [160] },
  },
  {
    id: 'jm-gyn',
    title: 'Jorge & Mateus — Goiânia',
    artistIds: ['jorge-mateus'],
    venueId: 'arena-cerrado',
    category: 'show',
    dayOffset: 3,
    hour: 22,
    status: 'on_sale',
    batch: '3º lote',
    sectors: SECTORS.arena,
    watchers: 5560,
    description: 'Show em casa, com participação de convidados.',
    official: { pista: [130, 150, 170], frontstage: [240, 270], camarote: [360, 400] },
  },
  {
    id: 'imagine-lis',
    title: 'Imagine Dragons — Lisboa',
    artistIds: ['imagine-dragons'],
    venueId: 'arena-tejo',
    category: 'show',
    dayOffset: 70,
    hour: 21,
    status: 'on_sale',
    batch: 'Venda geral',
    sectors: SECTORS.arena,
    watchers: 2100,
    description: 'Data internacional. Valores convertidos para reais apenas como referência.',
    official: { pista: [520], frontstage: [890], camarote: [1100] },
  },
  {
    id: 'ludmilla-rj',
    title: 'Ludmilla — Rio de Janeiro',
    artistIds: ['ludmilla'],
    venueId: 'arena-barra',
    category: 'show',
    dayOffset: 14,
    hour: 22,
    status: 'on_sale',
    batch: '2º lote',
    sectors: SECTORS.arena,
    watchers: 4890,
    description: 'Show com repertório completo e convidados.',
    official: { pista: [100, 120], frontstage: [180, 210], camarote: [280, 320] },
  },
  {
    id: 'riso-bh',
    title: 'Riso Solto — Noite de Stand-up',
    artistIds: ['riso-solto'],
    venueId: 'teatro-sabara',
    category: 'stand-up',
    dayOffset: 8,
    hour: 20,
    status: 'on_sale',
    batch: 'Venda geral',
    sectors: SECTORS.teatro,
    watchers: 640,
    description: 'Noite de comédia com cinco comediantes do coletivo (fictício).',
    official: { plateia: [90], 'plateia-sup': [70], balcao: [50] },
  },
];
