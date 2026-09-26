import { defaultPreferences } from '../core/defaults';
import { cheapestListing } from '../core/market';
import { buildNotifications } from '../core/monitoring/notifications';
import { runMonitoringCycle, type CycleReport } from '../core/monitoring/runCycle';
import { PLANS } from '../core/plans';
import type {
  AlertLevel,
  AlertSettingKey,
  ArtistPreference,
  ID,
  Notification,
  PriceAlertRule,
  RadarItem,
  User,
  UserPreference,
} from '../core/types';
import { artists, cities } from '../mocks/catalog';
import { createDemoAccount, DEMO_EMAIL } from '../mocks/demoUser';
import { createMockRegistry } from '../mocks/sources';
import { createDemoWorld } from '../mocks/world';
import { LocalStorageRepository, type AppRepository, type PersistedRoot, type UserData } from '../repositories/storage';

type Listener = () => void;
export type NotificationListener = (n: Notification[]) => void;

let seq = 0;
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Hash não-criptográfico — autenticação local apenas para demonstração. */
function demoHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export class ActionError extends Error {}

function freshRoot(): PersistedRoot {
  const anchor = new Date();
  const demo = createDemoAccount(anchor);
  return {
    version: 1,
    anchor: anchor.toISOString(),
    world: createDemoWorld(anchor),
    accounts: [demo.account],
    sessionUserId: null,
    userData: { [demo.account.user.id]: demo.data },
  };
}

export class AppStore {
  private root: PersistedRoot;
  private listeners = new Set<Listener>();
  private notificationListeners = new Set<NotificationListener>();
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  lastReport: CycleReport | null = null;
  running = false;

  constructor(private repo: AppRepository = new LocalStorageRepository()) {
    this.root = repo.load() ?? freshRoot();
    this.repo.save(this.root);
  }

  // ───── assinatura (useSyncExternalStore) ─────
  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getSnapshot = () => this.root;
  onNotifications(l: NotificationListener) {
    this.notificationListeners.add(l);
    return () => {
      this.notificationListeners.delete(l);
    };
  }

  private commit(next: PersistedRoot) {
    this.root = next;
    this.repo.save(next);
    this.listeners.forEach((l) => l());
  }

  // ───── sessão ─────
  get user(): User | null {
    return this.root.accounts.find((a) => a.user.id === this.root.sessionUserId)?.user ?? null;
  }

  get data(): UserData | null {
    const id = this.root.sessionUserId;
    return id ? this.root.userData[id] ?? null : null;
  }

  signUp(name: string, email: string, password: string): User {
    email = email.trim().toLowerCase();
    if (!name.trim()) throw new ActionError('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ActionError('E-mail inválido.');
    if (password.length < 6) throw new ActionError('A senha precisa ter pelo menos 6 caracteres.');
    if (this.root.accounts.some((a) => a.user.email === email)) throw new ActionError('Já existe uma conta com este e-mail.');
    const base = name.trim().split(/\s+/)[0].toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '') || 'user';
    const user: User = {
      id: uid('u'),
      name: name.trim(),
      username: `${base}${Math.floor(Math.random() * 900 + 100)}`,
      email,
      createdAt: new Date().toISOString(),
      plan: 'free',
      onboarded: false,
    };
    const data: UserData = {
      radar: [],
      artistPrefs: [],
      rules: [],
      prefs: defaultPreferences(),
      notifications: [],
      behavior: { clickedEventIds: [], ignoredEventIds: [], searchedTerms: [] },
      outboundClicks: [],
    };
    this.commit({
      ...this.root,
      accounts: [...this.root.accounts, { user, passwordHash: demoHash(password) }],
      userData: { ...this.root.userData, [user.id]: data },
      sessionUserId: user.id,
    });
    return user;
  }

  signIn(email: string, password: string): User {
    const acc = this.root.accounts.find((a) => a.user.email === email.trim().toLowerCase());
    if (!acc || (acc.user.email !== DEMO_EMAIL && acc.passwordHash !== demoHash(password)))
      throw new ActionError('E-mail ou senha incorretos.');
    this.commit({ ...this.root, sessionUserId: acc.user.id });
    return acc.user;
  }

  signInDemo(): User {
    const acc = this.root.accounts.find((a) => a.user.email === DEMO_EMAIL)!;
    this.commit({ ...this.root, sessionUserId: acc.user.id });
    return acc.user;
  }

  signOut() {
    this.setAuto(false);
    this.commit({ ...this.root, sessionUserId: null });
  }

  updateUser(patch: Partial<Pick<User, 'name' | 'username' | 'onboarded'>>) {
    const id = this.root.sessionUserId;
    if (!id) return;
    this.commit({
      ...this.root,
      accounts: this.root.accounts.map((a) => (a.user.id === id ? { ...a, user: { ...a.user, ...patch } } : a)),
    });
  }

  private updateData(fn: (d: UserData) => UserData) {
    const id = this.root.sessionUserId;
    if (!id) throw new ActionError('Entre na sua conta para continuar.');
    this.commit({ ...this.root, userData: { ...this.root.userData, [id]: fn(this.root.userData[id]) } });
  }

  // ───── preferências ─────
  updatePrefs(patch: Partial<UserPreference>) {
    this.updateData((d) => ({ ...d, prefs: { ...d.prefs, ...patch } }));
  }

  setAlertLevel(key: AlertSettingKey, level: AlertLevel) {
    this.updateData((d) => ({ ...d, prefs: { ...d.prefs, alertSettings: { ...d.prefs.alertSettings, [key]: level } } }));
  }

  // ───── artistas ─────
  followArtist(pref: Omit<ArtistPreference, 'followedAt'>) {
    this.updateData((d) => {
      const others = d.artistPrefs.filter((p) => p.artistId !== pref.artistId);
      const existing = d.artistPrefs.find((p) => p.artistId === pref.artistId);
      return { ...d, artistPrefs: [...others, { ...pref, followedAt: existing?.followedAt ?? new Date().toISOString() }] };
    });
  }

  unfollowArtist(artistId: ID) {
    this.updateData((d) => ({ ...d, artistPrefs: d.artistPrefs.filter((p) => p.artistId !== artistId) }));
  }

  // ───── Radar ─────
  upsertRadar(item: Omit<RadarItem, 'id' | 'addedAt'>) {
    this.updateData((d) => {
      const existing = d.radar.find((r) => r.eventId === item.eventId);
      if (!existing && d.radar.length >= PLANS.free.limits.radarItems)
        throw new ActionError(`O plano gratuito permite até ${PLANS.free.limits.radarItems} itens no Radar.`);
      const radarItem: RadarItem = existing
        ? { ...existing, ...item }
        : { ...item, id: uid('r'), addedAt: new Date().toISOString() };
      // O preço máximo do Radar vira uma regra de preço-alvo vinculada.
      const ruleId = `radar-${item.eventId}`;
      let rules = d.rules.filter((r) => r.id !== ruleId);
      if (item.maxPrice != null) {
        const old = d.rules.find((r) => r.id === ruleId);
        const same = old && old.maxPrice === item.maxPrice && old.sectorId === item.sectorId;
        rules = [
          ...rules,
          same
            ? old!
            : { id: ruleId, eventId: item.eventId, sectorId: item.sectorId, maxPrice: item.maxPrice, sourceId: null, active: true, createdAt: new Date().toISOString() },
        ];
      }
      return {
        ...d,
        rules,
        radar: existing ? d.radar.map((r) => (r.id === existing.id ? radarItem : r)) : [...d.radar, radarItem],
      };
    });
  }

  removeRadar(eventId: ID) {
    this.updateData((d) => ({
      ...d,
      radar: d.radar.filter((r) => r.eventId !== eventId),
      rules: d.rules.filter((r) => r.id !== `radar-${eventId}`),
    }));
  }

  // ───── Regras de preço ─────
  addRule(rule: Omit<PriceAlertRule, 'id' | 'createdAt' | 'active'>) {
    this.updateData((d) => {
      if (d.rules.length >= PLANS.free.limits.priceRules)
        throw new ActionError(`O plano gratuito permite até ${PLANS.free.limits.priceRules} alertas de preço.`);
      return { ...d, rules: [...d.rules, { ...rule, id: uid('p'), active: true, createdAt: new Date().toISOString() }] };
    });
  }

  toggleRule(id: ID) {
    this.updateData((d) => ({ ...d, rules: d.rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)) }));
  }

  removeRule(id: ID) {
    this.updateData((d) => ({
      ...d,
      rules: d.rules.filter((r) => r.id !== id),
      radar: id.startsWith('radar-') ? d.radar.map((r) => (`radar-${r.eventId}` === id ? { ...r, maxPrice: null } : r)) : d.radar,
    }));
  }

  // ───── Notificações ─────
  markRead(id: ID) {
    this.updateData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }

  markAllRead() {
    this.updateData((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
  }

  // ───── Comportamento (personalização) ─────
  trackClick(eventId: ID) {
    if (!this.data) return;
    this.updateData((d) => ({
      ...d,
      behavior: { ...d.behavior, clickedEventIds: [eventId, ...d.behavior.clickedEventIds.filter((x) => x !== eventId)].slice(0, 30) },
    }));
  }

  ignoreEvent(eventId: ID) {
    this.updateData((d) => ({ ...d, behavior: { ...d.behavior, ignoredEventIds: [...new Set([...d.behavior.ignoredEventIds, eventId])] } }));
  }

  clearBehavior() {
    this.updateData((d) => ({ ...d, behavior: { clickedEventIds: [], ignoredEventIds: [], searchedTerms: [] } }));
  }

  trackOutbound(listingId: ID) {
    if (!this.data) return;
    this.updateData((d) => ({ ...d, outboundClicks: [...d.outboundClicks, { listingId, at: new Date().toISOString() }].slice(-100) }));
  }

  // ───── Monitoramento (simulação local do worker) ─────
  async runCycle(): Promise<{ report: CycleReport; notifications: Notification[] }> {
    if (this.running) throw new ActionError('Já existe um ciclo em andamento.');
    this.running = true;
    this.listeners.forEach((l) => l());
    try {
      const anchor = new Date(this.root.anchor);
      const now = new Date();
      const { world, report } = await runMonitoringCycle(createMockRegistry(anchor), this.root.world, now);
      // Pequena pausa para a interface mostrar o estado "consultando fontes".
      await new Promise((r) => setTimeout(r, 700));

      // Gera alertas para todas as contas locais (como o worker faria para todos os usuários).
      const userData = { ...this.root.userData };
      let mine: Notification[] = [];
      for (const [uidKey, d] of Object.entries(userData)) {
        const { notifications, rules } = buildNotifications(report.changes, world, d, { artists, cities }, now, () => uid('n'));
        userData[uidKey] = { ...d, rules, notifications: [...notifications, ...d.notifications].slice(0, 200) };
        if (uidKey === this.root.sessionUserId) mine = notifications;
      }
      this.lastReport = report;
      this.running = false;
      this.commit({ ...this.root, world, userData });
      if (mine.length) this.notificationListeners.forEach((l) => l(mine));
      return { report, notifications: mine };
    } catch (e) {
      this.running = false;
      this.listeners.forEach((l) => l());
      throw e;
    }
  }

  get autoRunning() {
    return this.autoTimer != null;
  }

  setAuto(on: boolean, everyMs = 8000) {
    if (this.autoTimer) clearInterval(this.autoTimer);
    this.autoTimer = null;
    if (on) this.autoTimer = setInterval(() => void this.runCycle().catch(() => {}), everyMs);
    this.listeners.forEach((l) => l());
  }

  resetDemo() {
    this.setAuto(false);
    const session = this.root.sessionUserId;
    const fresh = freshRoot();
    // Mantém contas criadas pelo usuário, mas zera Radar/alertas do mundo simulado.
    const keep = this.root.accounts.filter((a) => a.user.email !== DEMO_EMAIL);
    const userData = { ...fresh.userData };
    for (const a of keep) {
      const d = this.root.userData[a.user.id];
      userData[a.user.id] = { ...d, notifications: [], rules: d.rules.map((r) => ({ ...r, lastTriggeredAt: undefined, lastTriggeredPrice: undefined })) };
    }
    this.lastReport = null;
    this.commit({ ...fresh, accounts: [...fresh.accounts, ...keep], userData, sessionUserId: session });
  }

  /** Preço atual para uma regra (usado ao criar alerta: "já está abaixo!"). */
  currentPriceFor(eventId: ID, sectorId: ID | null, sourceId: ID | null = null) {
    return cheapestListing(this.root.world.listings, eventId, sectorId, sourceId)?.price ?? null;
  }
}

export const store = new AppStore();
