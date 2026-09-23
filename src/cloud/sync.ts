import { parseSave, type SaveData } from '../logic/storage';
import { decide, isPristine } from './decide';

export interface CloudStore {
  /** De ruwe opgeslagen data, of `null` als er (nog) niets is. */
  pull(): Promise<unknown | null>;
  push(data: SaveData): Promise<void>;
  remove(): Promise<void>;
}

export type SyncStatus =
  | { kind: 'off' }
  | { kind: 'signedOut' }
  | { kind: 'syncing' }
  | { kind: 'synced'; at: string }
  | { kind: 'offline' }
  | { kind: 'error' };

export type StartOutcome = 'restored' | 'pushed' | 'none' | 'failed';

export interface SyncDeps {
  store: CloudStore;
  getLocal: () => SaveData | null;
  restore: (data: SaveData) => void;
  keepReplaced: (save: SaveData) => void;
  onStatus: (status: SyncStatus) => void;
  isOnline: () => boolean;
  throttleMs?: number;
}

/**
 * Houdt lokaal en cloud gelijk. Eerst één keer ophalen en vergelijken (`start`), pas daarna wordt er gepusht,
 * met een throttle zodat de tijdteller (elke 20 s een wijziging) niet elke keer een upload veroorzaakt.
 */
export class SyncEngine {
  private readonly deps: SyncDeps;
  private readonly throttleMs: number;
  private ready = false;
  private stopped = true;
  private generation = 0;
  private lastSynced: string | null = null;
  private lastPushAt = 0;
  private pushing = false;
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private startPromise: Promise<StartOutcome> | null = null;

  constructor(deps: SyncDeps) {
    this.deps = deps;
    this.throttleMs = deps.throttleMs ?? 30_000;
  }

  start(): Promise<StartOutcome> {
    this.stopped = false;
    if (this.startPromise) return this.startPromise;
    const p: Promise<StartOutcome> = this.runStart().then((outcome) => {
      if (outcome === 'failed' && this.startPromise === p) this.startPromise = null;
      return outcome;
    });
    this.startPromise = p;
    return p;
  }

  /** Aanroepen als de lokale save veranderd is. */
  notifyChanged(): void {
    if (this.ready && this.isDirty()) this.schedule();
  }

  /** Meteen bijwerken (app verborgen, weer online); start als de eerste keer nog niet gelukt was. */
  async flush(): Promise<void> {
    if (this.stopped) return;
    if (!this.ready) {
      await this.start();
      return;
    }
    if (this.isDirty()) await this.pushNow();
  }

  /** Verwijdert de cloudkopie; gooit als dat niet lukt. */
  async removeRemote(): Promise<void> {
    await this.deps.store.remove();
    this.lastSynced = null;
  }

  stop(): void {
    this.generation++;
    this.stopped = true;
    this.ready = false;
    this.startPromise = null;
    this.lastSynced = null;
    clearTimeout(this.pushTimer);
    clearTimeout(this.retryTimer);
    this.pushTimer = undefined;
    this.retryTimer = undefined;
  }

  private isDirty(): boolean {
    const local = this.deps.getLocal();
    return !!local && local.updatedAt !== this.lastSynced;
  }

  private reportFailure(): void {
    this.deps.onStatus({ kind: this.deps.isOnline() ? 'error' : 'offline' });
  }

  private async runStart(): Promise<StartOutcome> {
    const generation = this.generation;
    this.deps.onStatus({ kind: 'syncing' });
    let raw: unknown;
    try {
      raw = await this.deps.store.pull();
    } catch {
      if (generation !== this.generation) return 'failed';
      this.reportFailure();
      this.retryTimer = setTimeout(() => {
        this.retryTimer = undefined;
        void this.start();
      }, this.throttleMs);
      return 'failed';
    }
    if (generation !== this.generation) return 'failed';

    const remote = raw == null ? null : parseSave(raw);
    if (raw != null && !remote) {
      this.deps.onStatus({ kind: 'error' });
      return 'failed';
    }

    const local = this.deps.getLocal();
    const action = decide(local, remote);
    if (action === 'restore' && remote) {
      if (local && !isPristine(local)) this.deps.keepReplaced(local);
      this.lastSynced = remote.updatedAt;
      this.deps.restore(remote);
      this.ready = true;
      this.deps.onStatus({ kind: 'synced', at: new Date().toISOString() });
      return 'restored';
    }

    this.ready = true;
    if (action === 'push') {
      await this.pushNow();
      return 'pushed';
    }
    this.lastSynced = local?.updatedAt ?? null;
    this.deps.onStatus({ kind: 'synced', at: new Date().toISOString() });
    return 'none';
  }

  private schedule(): void {
    if (this.pushTimer !== undefined || !this.ready || this.stopped) return;
    const wait = Math.max(0, this.lastPushAt + this.throttleMs - Date.now());
    this.pushTimer = setTimeout(() => {
      this.pushTimer = undefined;
      void this.pushNow();
    }, wait);
  }

  private async pushNow(): Promise<void> {
    if (this.pushing) return;
    const local = this.deps.getLocal();
    if (!local || local.updatedAt === this.lastSynced) return;
    this.pushing = true;
    clearTimeout(this.pushTimer);
    this.pushTimer = undefined;
    try {
      await this.deps.store.push(local);
      this.lastSynced = local.updatedAt;
      this.deps.onStatus({ kind: 'synced', at: new Date().toISOString() });
    } catch {
      this.reportFailure();
    } finally {
      this.lastPushAt = Date.now();
      this.pushing = false;
    }
    if (!this.stopped && this.isDirty()) this.schedule();
  }
}
