/**
 * Persistência local (localStorage) usada nesta versão sem backend.
 *
 * Toda a aplicação acessa dados através de `AppRepository`; trocar por uma
 * implementação HTTP (API própria) não exige mudar as telas.
 */
import type {
  ArtistPreference,
  Behavior,
  ID,
  Notification,
  PriceAlertRule,
  RadarItem,
  User,
  UserPreference,
  WorldState,
} from '../core/types';

export interface Account {
  user: User;
  /** Hash local apenas para a demonstração. Em produção: autenticação no servidor. */
  passwordHash: string;
}

export interface UserData {
  radar: RadarItem[];
  artistPrefs: ArtistPreference[];
  rules: PriceAlertRule[];
  prefs: UserPreference;
  notifications: Notification[];
  behavior: Behavior;
  outboundClicks: { listingId: ID; at: string }[];
}

export interface PersistedRoot {
  version: 1;
  /** Momento de criação da demonstração: datas mockadas são relativas a ele. */
  anchor: string;
  world: WorldState;
  accounts: Account[];
  sessionUserId: ID | null;
  userData: Record<ID, UserData>;
}

export interface AppRepository {
  load(): PersistedRoot | null;
  save(root: PersistedRoot): void;
  clear(): void;
}

const KEY = 'avise:v1';

export class LocalStorageRepository implements AppRepository {
  private memory: PersistedRoot | null = null;

  load(): PersistedRoot | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return this.memory;
      const parsed = JSON.parse(raw) as PersistedRoot;
      return parsed.version === 1 ? parsed : null;
    } catch {
      return this.memory;
    }
  }

  save(root: PersistedRoot): void {
    this.memory = root;
    try {
      localStorage.setItem(KEY, JSON.stringify(root));
    } catch {
      /* armazenamento indisponível: segue em memória */
    }
  }

  clear(): void {
    this.memory = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }
}

export class MemoryRepository implements AppRepository {
  constructor(private root: PersistedRoot | null = null) {}
  load() {
    return this.root;
  }
  save(root: PersistedRoot) {
    this.root = root;
  }
  clear() {
    this.root = null;
  }
}
