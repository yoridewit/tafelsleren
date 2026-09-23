import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncEngine, type SyncStatus } from './sync';
import { emptySave, type SaveData } from '../logic/storage';

const older = '2026-09-01T10:00:00.000Z';
const newer = '2026-09-10T10:00:00.000Z';
const played = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), roundsDone: 1, stars: 5, updatedAt });
const pristine = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), updatedAt });

function setup(local: SaveData | null, remote: SaveData | null) {
  const h = {
    local,
    remote: remote as unknown,
    failPull: false,
    failPush: false,
    online: true,
    restored: [] as SaveData[],
    replaced: [] as SaveData[],
    statuses: [] as SyncStatus[],
  };
  const store = {
    pull: vi.fn(async (): Promise<unknown> => {
      if (h.failPull) throw new Error('down');
      return h.remote;
    }),
    push: vi.fn(async (d: SaveData): Promise<void> => {
      if (h.failPush) throw new Error('down');
      h.remote = d;
    }),
    remove: vi.fn(async (): Promise<void> => {
      h.remote = null;
    }),
  };
  const engine = new SyncEngine({
    store,
    getLocal: () => h.local,
    restore: (d) => {
      h.restored.push(d);
      h.local = d;
    },
    keepReplaced: (s) => void h.replaced.push(s),
    onStatus: (s) => void h.statuses.push(s),
    isOnline: () => h.online,
    throttleMs: 30_000,
  });
  const lastStatus = () => h.statuses[h.statuses.length - 1];
  return { h, store, engine, lastStatus };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SyncEngine.start', () => {
  it('herstelt remote als er lokaal niets is', async () => {
    const { h, store, engine, lastStatus } = setup(null, played(newer));
    expect(await engine.start()).toBe('restored');
    expect(h.restored).toHaveLength(1);
    expect(h.restored[0].updatedAt).toBe(newer);
    expect(store.push).not.toHaveBeenCalled();
    expect(lastStatus().kind).toBe('synced');
  });

  it('pusht de herstelde save niet meteen terug', async () => {
    const { store, engine } = setup(null, played(newer));
    await engine.start();
    engine.notifyChanged();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(store.push).not.toHaveBeenCalled();
  });

  it('pusht als remote ontbreekt', async () => {
    const local = played(newer);
    const { store, engine, lastStatus } = setup(local, null);
    expect(await engine.start()).toBe('pushed');
    expect(store.push).toHaveBeenCalledTimes(1);
    expect(store.push).toHaveBeenCalledWith(local);
    expect(lastStatus().kind).toBe('synced');
  });

  it('herstelt een nieuwere remote en bewaart de lokale versie', async () => {
    const local = played(older);
    const { h, engine } = setup(local, played(newer));
    expect(await engine.start()).toBe('restored');
    expect(h.replaced).toEqual([local]);
    expect(h.restored[0].updatedAt).toBe(newer);
  });

  it('bewaart een leeg lokaal profiel niet als back-up', async () => {
    const { h, engine } = setup(pristine(newer), played(older));
    expect(await engine.start()).toBe('restored');
    expect(h.replaced).toHaveLength(0);
  });

  it('pusht een nieuwere lokale versie', async () => {
    const local = played(newer);
    const { store, engine } = setup(local, played(older));
    expect(await engine.start()).toBe('pushed');
    expect(store.push).toHaveBeenCalledWith(local);
  });

  it('doet niets bij gelijke tijdstempels', async () => {
    const { store, engine } = setup(played(newer), played(newer));
    expect(await engine.start()).toBe('none');
    expect(store.push).not.toHaveBeenCalled();
  });

  it('pusht niet voordat de eerste pull klaar is', async () => {
    const { h, store, engine } = setup(played(older), played(older));
    let release!: () => void;
    store.pull.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          release = () => resolve(h.remote);
        }),
    );
    const started = engine.start();
    h.local = { ...h.local!, updatedAt: newer };
    engine.notifyChanged();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(store.push).not.toHaveBeenCalled();
    release();
    expect(await started).toBe('pushed');
    expect(store.push).toHaveBeenCalledTimes(1);
  });

  it('start is idempotent', async () => {
    const { store, engine } = setup(null, played(newer));
    await Promise.all([engine.start(), engine.start()]);
    expect(store.pull).toHaveBeenCalledTimes(1);
  });

  it('meldt een fout en probeert het opnieuw als de pull mislukt', async () => {
    const { h, engine, lastStatus } = setup(null, played(newer));
    h.failPull = true;
    expect(await engine.start()).toBe('failed');
    expect(lastStatus().kind).toBe('error');
    h.failPull = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(h.restored).toHaveLength(1);
  });

  it('meldt offline als de pull mislukt zonder verbinding', async () => {
    const { h, engine, lastStatus } = setup(null, played(newer));
    h.failPull = true;
    h.online = false;
    await engine.start();
    expect(lastStatus().kind).toBe('offline');
  });

  it('negeert een onbruikbare remote en overschrijft niets', async () => {
    const { h, store, engine, lastStatus } = setup(played(older), null);
    h.remote = { version: 99 };
    expect(await engine.start()).toBe('failed');
    expect(h.restored).toHaveLength(0);
    expect(store.push).not.toHaveBeenCalled();
    expect(lastStatus().kind).toBe('error');
  });

  it('gooit het resultaat weg als er tijdens de pull is gestopt', async () => {
    const { h, store, engine } = setup(null, played(newer));
    let release!: () => void;
    store.pull.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          release = () => resolve(h.remote);
        }),
    );
    const started = engine.start();
    engine.stop();
    release();
    expect(await started).toBe('failed');
    expect(h.restored).toHaveLength(0);
  });
});

describe('SyncEngine pushen', () => {
  it('throttlet: een tweede wijziging wacht tot 30 seconden na de vorige push', async () => {
    const { h, store, engine } = setup(played(older), null);
    await engine.start();
    expect(store.push).toHaveBeenCalledTimes(1);
    h.local = { ...h.local!, updatedAt: newer };
    engine.notifyChanged();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(store.push).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(store.push).toHaveBeenCalledTimes(2);
  });

  it('flush pusht meteen, ook binnen de throttle', async () => {
    const { h, store, engine } = setup(played(older), null);
    await engine.start();
    h.local = { ...h.local!, updatedAt: newer };
    await engine.flush();
    expect(store.push).toHaveBeenCalledTimes(2);
  });

  it('probeert opnieuw na een mislukte push', async () => {
    const { h, store, engine, lastStatus } = setup(played(newer), null);
    h.failPush = true;
    await engine.start();
    expect(lastStatus().kind).toBe('error');
    h.failPush = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(store.push).toHaveBeenCalledTimes(2);
    expect(lastStatus().kind).toBe('synced');
  });

  it('meldt offline als pushen mislukt zonder verbinding', async () => {
    const { h, engine, lastStatus } = setup(played(newer), null);
    h.failPush = true;
    h.online = false;
    await engine.start();
    expect(lastStatus().kind).toBe('offline');
  });

  it('stop voorkomt verdere pushes', async () => {
    const { h, store, engine } = setup(played(older), null);
    await engine.start();
    h.local = { ...h.local!, updatedAt: newer };
    engine.notifyChanged();
    engine.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(store.push).toHaveBeenCalledTimes(1);
  });
});

describe('SyncEngine.removeRemote', () => {
  it('verwijdert de cloudkopie', async () => {
    const { h, store, engine } = setup(played(newer), played(newer));
    await engine.removeRemote();
    expect(store.remove).toHaveBeenCalledTimes(1);
    expect(h.remote).toBeNull();
  });
});
