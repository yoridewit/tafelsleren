import { describe, it, expect } from 'vitest';
import { profileById } from '../data/profiles';
import { factsForIsland } from './facts';
import { isKnown } from './leitner';
import { computeUnlocks } from './progress';
import {
  CORRUPT_KEY,
  STORAGE_KEY,
  emptySave,
  keepReplaced,
  loadSave,
  parseSave,
  persistTransition,
  type KeyValueStorage,
} from './storage';

describe('updatedAt', () => {
  it('emptySave zet updatedAt gelijk aan createdAt', () => {
    const s = emptySave('Pip');
    expect(s.updatedAt).toBe(s.createdAt);
  });

  it('parseSave houdt een geldige updatedAt', () => {
    const s = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z' });
    expect(s!.updatedAt).toBe('2026-09-10T10:00:00.000Z');
  });

  it('parseSave valt terug op createdAt als updatedAt ontbreekt of ongeldig is', () => {
    const missing = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z' });
    expect(missing!.updatedAt).toBe('2026-09-01T10:00:00.000Z');
    const bad = parseSave({ version: 1, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: 'gisteren' });
    expect(bad!.updatedAt).toBe('2026-09-01T10:00:00.000Z');
  });
});

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
    dump: () => Object.fromEntries(m),
  };
}

describe('loadSave', () => {
  it('geeft een geldige save terug', () => {
    const save = emptySave('Pip');
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(save) });
    expect(loadSave(storage)!.elfName).toBe('Pip');
    expect(storage.getItem(CORRUPT_KEY)).toBeNull();
  });

  it('bewaart kapotte JSON onder de corrupt-sleutel en laat het origineel staan', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{kapot' });
    expect(loadSave(storage)).toBeNull();
    expect(storage.getItem(CORRUPT_KEY)).toBe('{kapot');
    expect(storage.getItem(STORAGE_KEY)).toBe('{kapot');
  });

  it('bewaart ook een onbruikbare versie', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) });
    expect(loadSave(storage)).toBeNull();
    expect(storage.getItem(CORRUPT_KEY)).toBe('{"version":2}');
  });

  it('overschrijft een eerdere corrupt-kopie niet', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{nieuw', [CORRUPT_KEY]: '{oud' });
    loadSave(storage);
    expect(storage.getItem(CORRUPT_KEY)).toBe('{oud');
  });

  it('geeft null zonder iets te bewaren als er niets is opgeslagen', () => {
    const storage = fakeStorage();
    expect(loadSave(storage)).toBeNull();
    expect(storage.dump()).toEqual({});
  });
});

describe('persistTransition', () => {
  it('schrijft een bestaande save', () => {
    const storage = fakeStorage();
    persistTransition(null, emptySave('Pip'), storage);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).elfName).toBe('Pip');
  });

  it('verwijdert alleen bij een overgang van een save naar null', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{kapot' });
    persistTransition(null, null, storage);
    expect(storage.getItem(STORAGE_KEY)).toBe('{kapot');
    persistTransition(emptySave('Pip'), null, storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('keepReplaced', () => {
  it('bewaart de laatste 2 vervangen saves', () => {
    const storage = fakeStorage();
    keepReplaced(emptySave('A'), storage, '2026-09-01T00:00:00.000Z');
    keepReplaced(emptySave('B'), storage, '2026-09-02T00:00:00.000Z');
    keepReplaced(emptySave('C'), storage, '2026-09-03T00:00:00.000Z');
    const keys = Object.keys(storage.dump()).sort();
    expect(keys).toEqual([
      `${STORAGE_KEY}-replaced-2026-09-02T00:00:00.000Z`,
      `${STORAGE_KEY}-replaced-2026-09-03T00:00:00.000Z`,
    ]);
  });
});

describe('profiles in saves', () => {
  it('emptySave defaults to Floor and starts empty', () => {
    const s = emptySave('Pip');
    expect(s.profileId).toBe('floor');
    expect(s.unlocked).toEqual([0]);
    expect(s.facts).toEqual({});
  });

  it('Lucy starts with the tables of 1 and 10 known and the table of 2 open', () => {
    const s = emptySave('Fleur', profileById('lucy'));
    expect(s.profileId).toBe('lucy');
    for (const k of factsForIsland(0)) expect(isKnown(s.facts[k])).toBe(true);
    expect(Object.keys(s.facts).sort()).toEqual([...factsForIsland(0)].sort());
    expect(s.unlocked).toEqual([0, 1]);
    expect(s.discovered).toEqual([0]);
    // nog niets gedaan vandaag: geen "nieuw geïntroduceerde" sommen die de daglimiet opeten
    expect(Object.values(s.facts).every((f) => f.introduced === undefined)).toBe(true);
    // eiland 1 gaat niet automatisch weer dicht en eiland 2 blijft nog dicht
    expect(computeUnlocks(s.facts, s.unlocked)).toEqual([0, 1]);
  });

  it('parseSave keeps a valid profileId and defaults the rest to floor', () => {
    expect(parseSave({ version: 1, profileId: 'lucy' })!.profileId).toBe('lucy');
    expect(parseSave({ version: 1 })!.profileId).toBe('floor');
    expect(parseSave({ version: 1, profileId: 'bob' })!.profileId).toBe('floor');
  });
});
