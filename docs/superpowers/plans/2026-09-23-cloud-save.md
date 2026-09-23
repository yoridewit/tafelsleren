# Cloud-opslag met Firebase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De voortgang van Floor wordt naast `localStorage` ook in Firebase (Firestore) bewaard en kan na een gewist of corrupt apparaat worden hersteld.

**Architecture:** Lokaal blijft leidend en werkt offline. Een `SyncEngine` (pure logica tegen een `CloudStore`-interface) vergelijkt bij inloggen lokaal en remote met `decide()`, en pusht daarna met een throttle van 30 seconden. Firebase (Auth met e-mail en wachtwoord, één Firestore-document per gebruiker met beveiligingsregels) zit achter een dunne adapter die lazy wordt geladen. Los daarvan wordt het lokale opslaan veiliger gemaakt (geen automatisch wissen bij een mislukte load).

**Tech Stack:** TypeScript (strict, `noUnusedLocals`), React 18, Vite, Vitest (environment `node`, geen DOM), `firebase` (modulaire SDK: `firebase/app`, `firebase/auth`, `firebase/firestore`).

**Spec:** `docs/superpowers/specs/2026-09-23-cloud-save-design.md`

## Global Constraints

- Alleen als alle vier `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` en `VITE_FIREBASE_APP_ID` gezet zijn staat de cloud aan. Anders werkt de app precies als voorheen (geen netwerkverkeer, geen extra UI-gedrag behalve het paneel "Niet ingesteld").
- De Firebase-SDK wordt alleen lazy geladen via `import('firebase/app')`, `import('firebase/auth')` en `import('firebase/firestore')`, zodat de eerste load niet zwaarder wordt.
- Floor ziet in het kinderdeel niets van de cloud. Fouten worden nooit aan Floor getoond, alleen als statusregel in het Ouderoverzicht.
- Inloggen met e-mail en wachtwoord via `signInWithEmailAndPassword`. De client roept nooit `createUserWithEmailAndPassword` aan. Geen e-maillink en geen e-mailcode.
- Pushen met een throttle van maximaal één keer per 30 seconden (geen debounce, want de tijdteller wijzigt de save elke 20 seconden). Pushen is pas toegestaan nadat de eerste pull en `decide` klaar zijn.
- Elke Firestore-schrijfactie (`push`, `remove`) gaat door `guardWrite`: die gooit meteen als `navigator.onLine` onwaar is en breekt na 15 seconden af, omdat Firestore offline schrijfacties anders onbepaald laat openstaan.
- `tafels-elfje-v1` wordt alleen verwijderd bij een overgang van een bestaande save naar `null`, nooit bij een initiële `null`.
- Cloudopslag: document `saves/{uid}` met de velden `json` (de save als JSON-tekst) en `updatedAt`, plus per push een snapshot `saves/{uid}/snapshots/{YYYY-MM-DD}` in dezelfde batch, zonder opruiming. Lokaal blijven maximaal de laatste 2 `tafels-elfje-v1-replaced-<iso>`-back-ups.
- Tests draaien nooit tegen een echt Firebase-project.
- Zichtbare tekst is Nederlands, code-commentaar is kort en Nederlands (zoals de rest van de repo).
- Elke commit eindigt met de regel `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Draai tests met `npx vitest run <pad>`, typecheck met `npx tsc --noEmit`.

## File Structure

- `src/logic/storage.ts` (wijzigen): `updatedAt` in `SaveData`, corrupt-vangnet in `loadSave`, `persistTransition`, `keepReplaced`, `KeyValueStorage`.
- `src/state/reducer.ts` (wijzigen): actie `restore`, `stampedReducer`.
- `src/state/store.tsx` (wijzigen): gebruikt `stampedReducer` en `persistTransition`.
- `src/cloud/decide.ts` (nieuw): `isPristine`, `decide`.
- `src/cloud/sync.ts` (nieuw): `CloudStore`, `SyncStatus`, `SyncEngine`.
- `src/cloud/client.ts` (nieuw): lazy Firebase-initialisatie, `cloudConfigured`.
- `src/cloud/auth.ts` (nieuw): inloggen, uitloggen, auth-events.
- `src/cloud/guard.ts` (nieuw): `guardWrite` (offline en time-out voor schrijfacties).
- `src/cloud/store.ts` (nieuw): `firestoreStore: CloudStore`.
- `src/cloud/statusText.ts` (nieuw): statusregel-tekst.
- `src/cloud/CloudProvider.tsx` (nieuw): React-context die de engine aan de app koppelt.
- `src/components/CloudLogin.tsx` (nieuw): e-mail en wachtwoord formulier.
- `src/components/MathGate.tsx` (nieuw): de rekensom uit `ParentGate`, herbruikbaar.
- `src/screens/CloudPanel.tsx` (nieuw): paneel in het Ouderoverzicht.
- `src/screens/ParentGate.tsx`, `src/screens/Parent.tsx`, `src/screens/Welcome.tsx`, `src/main.tsx` (wijzigen).
- `firestore.rules`, `docs/firebase-setup.md`, `README.md` (nieuw/wijzigen).
- Tests: `src/logic/storage.test.ts`, `src/state/reducer.test.ts`, `src/cloud/decide.test.ts`, `src/cloud/sync.test.ts`, `src/cloud/client.test.ts`, `src/cloud/guard.test.ts`, `src/cloud/statusText.test.ts`.
---

### Task 1: `updatedAt` op de save, `stampedReducer` en de actie `restore`

**Files:**
- Modify: `src/logic/storage.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/store.tsx`
- Create: `src/logic/storage.test.ts`
- Modify: `src/state/reducer.test.ts`

**Interfaces:**
- Produces: `SaveData.updatedAt: string` (ISO); `Action` krijgt `{ type: 'restore'; data: SaveData }`; `stampedReducer(state: AppState, action: Action, now?: () => string): AppState`.

- [ ] **Step 1: Schrijf de falende tests voor `updatedAt`**

Maak `src/logic/storage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emptySave, parseSave } from './storage';

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
```

- [ ] **Step 2: Run de test en controleer dat hij faalt**

Run: `npx vitest run src/logic/storage.test.ts`
Expected: FAIL (`updatedAt` is `undefined`).

- [ ] **Step 3: Implementeer `updatedAt` in `storage.ts`**

In de `SaveData`-interface, na `createdAt: string;`:

```ts
  /** Tijdstip (ISO) van de laatste wijziging; bepaalt bij synchroniseren welke kant nieuwer is. */
  updatedAt: string;
```

Vervang in `emptySave` de laatste twee regels van het object:

```ts
    settings: { sound: true, speech: true, music: true, musicVolume: 1, voice: null, dailyLimitMinutes: null },
    createdAt: new Date().toISOString(),
  };
```

door:

```ts
    settings: { sound: true, speech: true, music: true, musicVolume: 1, voice: null, dailyLimitMinutes: null },
    createdAt: now,
    updatedAt: now,
  };
```

en voeg als eerste regel in de body van `emptySave` toe: `const now = new Date().toISOString();`.

Voeg boven `parseFact` een helper toe:

```ts
const iso = (v: unknown, d: string) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : d);
```

Vervang in `parseSave` de regel `createdAt: str(raw.createdAt, base.createdAt),` door:

```ts
    createdAt,
    updatedAt: iso(raw.updatedAt, createdAt),
```

en voeg in `parseSave` direct na `const base = emptySave();` toe: `const createdAt = str(raw.createdAt, base.createdAt);`.

- [ ] **Step 4: Run de test en controleer dat hij slaagt**

Run: `npx vitest run src/logic/storage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Schrijf de falende tests voor `stampedReducer` en `restore`**

Voeg in `src/state/reducer.test.ts` de imports aan: pas de bestaande importregel `import { reducer, initialState, roundReward, type AppState } from './reducer';` aan naar:

```ts
import { reducer, initialState, roundReward, stampedReducer, type Action, type AppState } from './reducer';
```

Voeg onderaan het bestand toe:

```ts
describe('stampedReducer', () => {
  const NOW = '2026-09-23T10:00:00.000Z';
  const stamp = (s: AppState, a: Action) => stampedReducer(s, a, () => NOW);

  it('zet updatedAt bij een echte wijziging', () => {
    const after = stamp(started(), { type: 'answer', key: '2-3', correct: true, ms: 1500, today: T });
    expect(after.save!.updatedAt).toBe(NOW);
  });

  it('laat updatedAt staan als er niets verandert', () => {
    const before = started();
    const after = stamp(before, { type: 'unlock', island: 0 });
    expect(after.save!.updatedAt).toBe(before.save!.updatedAt);
  });

  it('stempelt een back-up die wordt teruggezet (import) als wijziging', () => {
    const data = { ...emptySave('Lila'), updatedAt: '2026-09-01T00:00:00.000Z' };
    const after = stamp(started(), { type: 'import', data });
    expect(after.save!.elfName).toBe('Lila');
    expect(after.save!.updatedAt).toBe(NOW);
  });

  it('restore houdt de updatedAt uit de cloud', () => {
    const data = { ...emptySave('Lila'), updatedAt: '2026-09-01T00:00:00.000Z' };
    const after = stamp(started(), { type: 'restore', data });
    expect(after.save!.elfName).toBe('Lila');
    expect(after.save!.updatedAt).toBe('2026-09-01T00:00:00.000Z');
  });

  it('reset geeft een lege save zonder te stempelen', () => {
    expect(stamp(started(), { type: 'reset' }).save).toBeNull();
  });
});
```

- [ ] **Step 6: Run de test en controleer dat hij faalt**

Run: `npx vitest run src/state/reducer.test.ts`
Expected: FAIL (`stampedReducer` is niet geëxporteerd).

- [ ] **Step 7: Implementeer `restore` en `stampedReducer` in `reducer.ts`**

Voeg aan de `Action`-union toe, na `| { type: 'import'; data: SaveData }`:

```ts
  | { type: 'restore'; data: SaveData }
```

Voeg in `reducer()` na de regel `if (action.type === 'import') return initialState(action.data);` toe:

```ts
  if (action.type === 'restore') return initialState(action.data);
```

Voeg onderaan `reducer.ts` toe:

```ts
/** Zet `updatedAt` op elke echte wijziging van de save; `restore` houdt het tijdstip uit de cloud. */
export function stampedReducer(
  state: AppState,
  action: Action,
  now: () => string = () => new Date().toISOString(),
): AppState {
  const next = reducer(state, action);
  if (action.type === 'restore' || !next.save || next.save === state.save) return next;
  return { ...next, save: { ...next.save, updatedAt: now() } };
}
```

- [ ] **Step 8: Gebruik `stampedReducer` in `store.tsx`**

Wijzig de import `import { reducer, initialState, type Action, type AppState } from './reducer';` naar:

```ts
import { stampedReducer, initialState, type Action, type AppState } from './reducer';
```

en `useReducer(reducer, null, ...)` naar `useReducer(stampedReducer, null, ...)`.

- [ ] **Step 9: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: alle tests PASS, geen typefouten.

- [ ] **Step 10: Commit**

```bash
git add src/logic/storage.ts src/logic/storage.test.ts src/state/reducer.ts src/state/reducer.test.ts src/state/store.tsx
git commit -m "$(cat <<'EOF'
Stamp updatedAt on every save change and add a restore action

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Lokaal vangnet: geen automatisch wissen, corrupt-kopie en replaced-back-ups

**Files:**
- Modify: `src/logic/storage.ts`
- Modify: `src/state/store.tsx`
- Modify: `src/logic/storage.test.ts`

**Interfaces:**
- Consumes: `SaveData`, `parseSave`, `writeSave` uit `storage.ts` (Task 1).
- Produces: `KeyValueStorage`, `CORRUPT_KEY`, `loadSave(storage)` (bewaart onbruikbare tekst), `persistTransition(prev, next, storage?)`, `keepReplaced(save, storage?, now?)`.

- [ ] **Step 1: Schrijf de falende tests**

Vervang de eerste regel van `src/logic/storage.test.ts` (`import { emptySave, parseSave } from './storage';`) door:

```ts
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
```

Voeg onderaan het bestand toe:

```ts
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
```

- [ ] **Step 2: Run de tests en controleer dat ze falen**

Run: `npx vitest run src/logic/storage.test.ts`
Expected: FAIL (`CORRUPT_KEY`, `persistTransition`, `keepReplaced` bestaan niet).

- [ ] **Step 3: Implementeer in `storage.ts`**

Vervang de bestaande `loadSave` (en laat `writeSave` staan) door dit blok, en zet de nieuwe exports/constanten eronder:

```ts
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export const CORRUPT_KEY = `${STORAGE_KEY}-corrupt`;
const REPLACED_PREFIX = `${STORAGE_KEY}-replaced-`;
const KEEP_REPLACED = 2;

/** Bewaart onbruikbare opgeslagen tekst zodat hij nooit stilletjes verdwijnt (een eerdere kopie blijft staan). */
function stashCorrupt(raw: string, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    if (storage.getItem(CORRUPT_KEY) === null) storage.setItem(CORRUPT_KEY, raw);
  } catch {
    // opslag vol of geblokkeerd
  }
}

export function loadSave(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): SaveData | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseSave(JSON.parse(raw));
    if (parsed) return parsed;
  } catch {
    // valt door naar het vangnet hieronder
  }
  if (raw) stashCorrupt(raw, storage);
  return null;
}
```

Voeg onderaan `storage.ts` toe (na `writeSave`):

```ts
/** Schrijft een bestaande save; wist alleen bij een overgang van een save naar `null` (expliciete reset). */
export function persistTransition(
  prev: SaveData | null,
  next: SaveData | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage,
) {
  if (next) writeSave(next, storage);
  else if (prev) writeSave(null, storage);
}

/** Bewaart een lokale save die door de cloud is vervangen; alleen de laatste 2 blijven bestaan. */
export function keepReplaced(
  save: SaveData,
  storage: KeyValueStorage = localStorage,
  now: string = new Date().toISOString(),
) {
  try {
    storage.setItem(`${REPLACED_PREFIX}${now}`, JSON.stringify(save));
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(REPLACED_PREFIX)) keys.push(k);
    }
    keys.sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_REPLACED))) storage.removeItem(k);
  } catch {
    // opslag vol of geblokkeerd
  }
}
```

- [ ] **Step 4: Run de tests en controleer dat ze slagen**

Run: `npx vitest run src/logic/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Gebruik `persistTransition` in `store.tsx`**

Wijzig `import { loadSave, writeSave } from '../logic/storage';` naar:

```ts
import { loadSave, persistTransition, type SaveData } from '../logic/storage';
```

Voeg `useRef` toe aan de React-import (`import { createContext, useContext, useEffect, useReducer, useRef, ... } from 'react';`) en vervang

```ts
  useEffect(() => writeSave(state.save), [state.save]);
```

door:

```ts
  // Wissen gebeurt alleen bij een echte reset (save -> null), nooit omdat het laden mislukte.
  const lastSave = useRef<SaveData | null>(null);
  useEffect(() => {
    persistTransition(lastSave.current, state.save);
    lastSave.current = state.save;
  }, [state.save]);
```

- [ ] **Step 6: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, geen typefouten.

- [ ] **Step 7: Commit**

```bash
git add src/logic/storage.ts src/logic/storage.test.ts src/state/store.tsx
git commit -m "$(cat <<'EOF'
Never wipe unreadable local saves: keep a corrupt copy and only delete on reset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `decide()` en `isPristine()`

**Files:**
- Create: `src/cloud/decide.ts`
- Create: `src/cloud/decide.test.ts`

**Interfaces:**
- Consumes: `SaveData` uit `../logic/storage`.
- Produces: `type SyncAction = 'none' | 'push' | 'restore'`; `isPristine(save: SaveData): boolean`; `decide(local: SaveData | null, remote: SaveData | null): SyncAction`.

- [ ] **Step 1: Schrijf de falende tests**

Maak `src/cloud/decide.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decide, isPristine } from './decide';
import { emptySave, type SaveData } from '../logic/storage';
import { newFactState } from '../logic/leitner';

const older = '2026-09-01T10:00:00.000Z';
const newer = '2026-09-10T10:00:00.000Z';
const played = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), roundsDone: 1, stars: 5, updatedAt });
const pristine = (updatedAt: string): SaveData => ({ ...emptySave('Pip'), updatedAt });

describe('isPristine', () => {
  it('is waar voor een net aangemaakt profiel', () => {
    expect(isPristine(emptySave('Pip'))).toBe(true);
  });

  it('is onwaar zodra er sterren, rondes, aankopen of geziene sommen zijn', () => {
    expect(isPristine({ ...emptySave('Pip'), stars: 1 })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), roundsDone: 1 })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), owned: ['strik'] })).toBe(false);
    expect(isPristine({ ...emptySave('Pip'), facts: { '2-3': { ...newFactState(), seen: 1 } } })).toBe(false);
  });
});

describe('decide', () => {
  it('doet niets als beide kanten ontbreken', () => {
    expect(decide(null, null)).toBe('none');
  });

  it('pusht als remote ontbreekt', () => {
    expect(decide(played(newer), null)).toBe('push');
    expect(decide(pristine(newer), null)).toBe('push');
  });

  it('herstelt als local ontbreekt', () => {
    expect(decide(null, played(older))).toBe('restore');
  });

  it('herstelt als local leeg is en remote voortgang heeft, ook als local nieuwer is', () => {
    expect(decide(pristine(newer), played(older))).toBe('restore');
  });

  it('pusht als remote leeg is en local voortgang heeft, ook als remote nieuwer is', () => {
    expect(decide(played(older), pristine(newer))).toBe('push');
  });

  it('doet niets als beide leeg zijn', () => {
    expect(decide(pristine(older), pristine(newer))).toBe('none');
  });

  it('laat de nieuwste winnen als beide voortgang hebben', () => {
    expect(decide(played(older), played(newer))).toBe('restore');
    expect(decide(played(newer), played(older))).toBe('push');
  });

  it('doet niets bij gelijke tijdstempels', () => {
    expect(decide(played(newer), played(newer))).toBe('none');
  });
});
```

- [ ] **Step 2: Run de tests en controleer dat ze falen**

Run: `npx vitest run src/cloud/decide.test.ts`
Expected: FAIL (module `./decide` bestaat niet).

- [ ] **Step 3: Implementeer `decide.ts`**

Maak `src/cloud/decide.ts`:

```ts
import type { SaveData } from '../logic/storage';

export type SyncAction = 'none' | 'push' | 'restore';

/** Een save zonder enige voortgang, bijv. een net aangemaakt profiel op een gewist apparaat. */
export function isPristine(save: SaveData): boolean {
  return (
    save.roundsDone === 0 &&
    save.stars === 0 &&
    save.owned.length === 0 &&
    Object.values(save.facts).every((f) => f.seen === 0)
  );
}

/** Bepaalt wat er met lokaal en remote moet gebeuren; `remote` is al door `parseSave` gehaald. */
export function decide(local: SaveData | null, remote: SaveData | null): SyncAction {
  if (!remote) return local ? 'push' : 'none';
  if (!local) return 'restore';
  const localEmpty = isPristine(local);
  const remoteEmpty = isPristine(remote);
  if (localEmpty && remoteEmpty) return 'none';
  if (localEmpty) return 'restore';
  if (remoteEmpty) return 'push';
  const l = Date.parse(local.updatedAt);
  const r = Date.parse(remote.updatedAt);
  if (l === r) return 'none';
  return r > l ? 'restore' : 'push';
}
```

- [ ] **Step 4: Run de tests en controleer dat ze slagen**

Run: `npx vitest run src/cloud/decide.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cloud/decide.ts src/cloud/decide.test.ts
git commit -m "$(cat <<'EOF'
Add the cloud sync decision rules

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `SyncEngine` (pull-eerst, throttle, opnieuw proberen)

**Files:**
- Create: `src/cloud/sync.ts`
- Create: `src/cloud/sync.test.ts`

**Interfaces:**
- Consumes: `parseSave`, `SaveData` uit `../logic/storage`; `decide`, `isPristine` uit `./decide`.
- Produces:
  - `interface CloudStore { pull(): Promise<unknown | null>; push(data: SaveData): Promise<void>; remove(): Promise<void> }`
  - `type SyncStatus = { kind: 'off' } | { kind: 'signedOut' } | { kind: 'syncing' } | { kind: 'synced'; at: string } | { kind: 'offline' } | { kind: 'error' }`
  - `type StartOutcome = 'restored' | 'pushed' | 'none' | 'failed'`
  - `interface SyncDeps { store: CloudStore; getLocal(): SaveData | null; restore(data: SaveData): void; keepReplaced(save: SaveData): void; onStatus(status: SyncStatus): void; isOnline(): boolean; throttleMs?: number }`
  - `class SyncEngine` met `start(): Promise<StartOutcome>`, `notifyChanged(): void`, `flush(): Promise<void>`, `removeRemote(): Promise<void>`, `stop(): void`.

- [ ] **Step 1: Schrijf de falende tests**

Maak `src/cloud/sync.test.ts`:

```ts
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
```

- [ ] **Step 2: Run de tests en controleer dat ze falen**

Run: `npx vitest run src/cloud/sync.test.ts`
Expected: FAIL (module `./sync` bestaat niet).

- [ ] **Step 3: Implementeer `sync.ts`**

Maak `src/cloud/sync.ts`:

```ts
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
```

- [ ] **Step 4: Run de tests en controleer dat ze slagen**

Run: `npx vitest run src/cloud/sync.test.ts`
Expected: PASS (19 tests). Faalt er een op timing, controleer dat `vi.useFakeTimers()` ook `Date` nept (standaard wel) en dat je `advanceTimersByTimeAsync` gebruikt (niet de sync-variant).

- [ ] **Step 5: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, geen typefouten.

- [ ] **Step 6: Commit**

```bash
git add src/cloud/sync.ts src/cloud/sync.test.ts
git commit -m "$(cat <<'EOF'
Add the cloud sync engine: pull first, throttled pushes, retry on failure

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Firebase-adapter, beveiligingsregels en opzetdocumentatie

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/cloud/client.ts`, `src/cloud/auth.ts`, `src/cloud/store.ts`, `src/cloud/guard.ts`
- Create: `src/cloud/client.test.ts`, `src/cloud/guard.test.ts`
- Create: `firestore.rules`
- Create: `docs/firebase-setup.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `CloudStore` uit `./sync`; `SaveData` uit `../logic/storage`; `dayKey` uit `../logic/dates`.
- Produces:
  - `cloudConfigured: boolean`, `interface Firebase { app: FirebaseApp; auth: Auth; db: Firestore }`, `getFirebase(): Promise<Firebase>` (`client.ts`)
  - `signIn(email: string, password: string): Promise<void>`, `signOut(): Promise<void>`, `onAuthChange(cb: (signedIn: boolean) => void): Promise<() => void>` (`auth.ts`)
  - `guardWrite<T>(run: () => Promise<T>, opts: { online: () => boolean; timeoutMs?: number }): Promise<T>` (`guard.ts`)
  - `firestoreStore: CloudStore` (`store.ts`)

- [ ] **Step 1: Installeer de dependency**

Run: `npm install firebase`
Expected: `package.json` krijgt `firebase` onder `dependencies`.

- [ ] **Step 2: Schrijf de falende tests**

Maak `src/cloud/guard.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guardWrite } from './guard';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('guardWrite', () => {
  it('geeft het resultaat door als alles goed gaat', async () => {
    await expect(guardWrite(async () => 42, { online: () => true })).resolves.toBe(42);
  });

  it('gooit meteen en start niets als er geen verbinding is', async () => {
    const run = vi.fn(async () => 1);
    await expect(guardWrite(run, { online: () => false })).rejects.toThrow('Offline');
    expect(run).not.toHaveBeenCalled();
  });

  it('breekt af als de schrijfactie blijft hangen', async () => {
    const pending = guardWrite(() => new Promise<void>(() => {}), { online: () => true, timeoutMs: 15_000 });
    const assertion = expect(pending).rejects.toThrow('Time-out');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });

  it('geeft fouten van de schrijfactie zelf door', async () => {
    const failing = async () => {
      throw new Error('geweigerd');
    };
    await expect(guardWrite(failing, { online: () => true })).rejects.toThrow('geweigerd');
  });
});
```

Maak `src/cloud/client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(values: Record<string, string>) {
  for (const k of KEYS) vi.stubEnv(k, values[k] ?? '');
  vi.resetModules();
  return import('./client');
}

describe('cloud client', () => {
  it('staat uit zonder omgevingsvariabelen en weigert Firebase te laden', async () => {
    const { cloudConfigured, getFirebase } = await load({});
    expect(cloudConfigured).toBe(false);
    await expect(getFirebase()).rejects.toThrow('niet ingesteld');
  });

  it('staat uit als er één variabele ontbreekt', async () => {
    const { cloudConfigured } = await load({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'd',
      VITE_FIREBASE_PROJECT_ID: 'p',
    });
    expect(cloudConfigured).toBe(false);
  });

  it('staat aan met alle vier de variabelen', async () => {
    const { cloudConfigured } = await load({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'd',
      VITE_FIREBASE_PROJECT_ID: 'p',
      VITE_FIREBASE_APP_ID: 'a',
    });
    expect(cloudConfigured).toBe(true);
  });
});
```

- [ ] **Step 3: Run de tests en controleer dat ze falen**

Run: `npx vitest run src/cloud/guard.test.ts src/cloud/client.test.ts`
Expected: FAIL (modules `./guard` en `./client` bestaan niet).

- [ ] **Step 4: Implementeer `guard.ts` en `client.ts`**

Maak `src/cloud/guard.ts`:

```ts
/** Firestore laat schrijfacties offline onbepaald openstaan; dit maakt er een fout van die de engine kan afhandelen. */
export async function guardWrite<T>(
  run: () => Promise<T>,
  opts: { online: () => boolean; timeoutMs?: number },
): Promise<T> {
  if (!opts.online()) throw new Error('Offline');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Time-out')), opts.timeoutMs ?? 15_000);
  });
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
```

Maak `src/cloud/client.ts`:

```ts
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** Zonder alle vier de variabelen doet de app niets met de cloud en werkt hij precies als voorheen. */
export const cloudConfigured = Object.values(config).every(Boolean);

export interface Firebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let firebase: Promise<Firebase> | null = null;

/** Laadt de Firebase-SDK pas als het nodig is, zodat de eerste load van de app niet zwaarder wordt. */
export function getFirebase(): Promise<Firebase> {
  if (!cloudConfigured) return Promise.reject(new Error('Cloud-opslag is niet ingesteld'));
  firebase ??= Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]).then(
    ([{ initializeApp }, { getAuth }, { getFirestore }]) => {
      const app = initializeApp(config as { apiKey: string; authDomain: string; projectId: string; appId: string });
      return { app, auth: getAuth(app), db: getFirestore(app) };
    },
  );
  return firebase;
}
```

- [ ] **Step 5: Run de tests en controleer dat ze slagen**

Run: `npx vitest run src/cloud/guard.test.ts src/cloud/client.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Implementeer `auth.ts` en `store.ts`**

Maak `src/cloud/auth.ts`:

```ts
import { getFirebase } from './client';

export async function signIn(email: string, password: string): Promise<void> {
  const { auth } = await getFirebase();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  const { auth } = await getFirebase();
  const { signOut: firebaseSignOut } = await import('firebase/auth');
  await firebaseSignOut(auth);
}

/** Meldt de huidige stand zodra die bekend is en daarna elke wijziging. Geeft een stopfunctie terug. */
export async function onAuthChange(cb: (signedIn: boolean) => void): Promise<() => void> {
  const { auth } = await getFirebase();
  const { onAuthStateChanged } = await import('firebase/auth');
  return onAuthStateChanged(auth, (user) => cb(user !== null));
}
```

Maak `src/cloud/store.ts`:

```ts
import { dayKey } from '../logic/dates';
import type { SaveData } from '../logic/storage';
import { getFirebase } from './client';
import { guardWrite } from './guard';
import type { CloudStore } from './sync';

async function uid(): Promise<string> {
  const { auth } = await getFirebase();
  if (!auth.currentUser) throw new Error('Niet ingelogd');
  return auth.currentUser.uid;
}

const online = () => navigator.onLine;

/**
 * Dunne adapter op Firestore (zie firestore.rules): `saves/{uid}` met de save als JSON-tekst, en per push een
 * snapshot `saves/{uid}/snapshots/{dag}` in dezelfde batch.
 */
export const firestoreStore: CloudStore = {
  async pull() {
    const { db } = await getFirebase();
    const { doc, getDocFromServer } = await import('firebase/firestore');
    const snap = await getDocFromServer(doc(db, 'saves', await uid()));
    if (!snap.exists()) return null;
    return JSON.parse(String(snap.data().json));
  },
  async push(save: SaveData) {
    const { db } = await getFirebase();
    const { doc, writeBatch } = await import('firebase/firestore');
    const id = await uid();
    const fields = { json: JSON.stringify(save), updatedAt: save.updatedAt };
    await guardWrite(
      () => {
        const batch = writeBatch(db);
        batch.set(doc(db, 'saves', id), fields);
        batch.set(doc(db, 'saves', id, 'snapshots', dayKey()), fields);
        return batch.commit();
      },
      { online },
    );
  },
  async remove() {
    const { db } = await getFirebase();
    const { doc, deleteDoc } = await import('firebase/firestore');
    const id = await uid();
    await guardWrite(() => deleteDoc(doc(db, 'saves', id)), { online });
  },
};
```

- [ ] **Step 7: Schrijf de beveiligingsregels**

Maak `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Alleen de ingelogde eigenaar mag de eigen save en snapshots lezen en schrijven.
    match /saves/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /snapshots/{day} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

- [ ] **Step 8: Schrijf de opzetdocumentatie**

Maak `docs/firebase-setup.md`:

````markdown
# Cloud-opslag instellen (Firebase)

Zonder deze stappen werkt de app gewoon, alleen zonder cloud-back-up (het paneel "Cloud-opslag" in het Ouderoverzicht meldt dan "Niet ingesteld"). Het gratis Spark-plan is genoeg.

## Eenmalig instellen

1. Ga naar console.firebase.google.com en maak een project (Google Analytics is niet nodig).
2. Projectoverzicht → web-icoon `</>` → registreer een web-app (Firebase Hosting hoef je niet aan te zetten). Kopieer de vier waarden `apiKey`, `authDomain`, `projectId` en `appId` uit de getoonde config.
3. Build → Firestore Database → "Create database", kies productiemodus en een regio in Europa. Ga daarna naar het tabblad Rules, plak de inhoud van `firestore.rules` en publiceer.
4. Build → Authentication → Get started → Sign-in method → "Email/Password" aanzetten (laat "Email link (passwordless sign-in)" uit).
5. Authentication → Users → "Add user": vul je e-mailadres en een wachtwoord in. Dit is het account waarmee je in de app inlogt. Biedt de console onder Settings → User actions de optie "Enable create (sign-up)", zet die dan uit; de app maakt nooit zelf accounts aan.
6. Zet de vier waarden in `.env.local` (staat in `.gitignore`) en in Vercel (Project Settings → Environment Variables, daarna opnieuw deployen):

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=jouw-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=jouw-project
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

   Deze web-config is bedoeld om openbaar te zijn; de regels in `firestore.rules` beschermen de data.
7. Open de app op het apparaat van Floor → Ouderoverzicht (rekensom) → Cloud-opslag → e-mailadres en wachtwoord.

## Handmatig controleren

1. Log in via het Ouderoverzicht: de status wordt "Laatst opgeslagen hh:mm". In de Firestore-console staat onder `saves` een document met jouw uid, met de velden `json` en `updatedAt`, en daaronder `snapshots` met het document van vandaag.
2. Speel een ronde en wacht 30 seconden (of zet de app op de achtergrond): `updatedAt` in dat document wordt bijgewerkt.
3. Wis de sitegegevens van de app (of test in een privévenster) en open de app: Welcome-scherm → "Ouder? Voortgang herstellen" → rekensom → e-mail en wachtwoord. De voortgang is terug.
4. Zet het netwerk uit (devtools → Network → Offline) en speel een ronde: status "Offline, wordt later opgeslagen". Zet het netwerk weer aan: binnen een halve minuut staat het er weer in.
5. Ouderoverzicht → "Alles wissen" terwijl je bent ingelogd: het document `saves/{uid}` verdwijnt; de snapshots blijven bestaan.
6. Zet in devtools (Application → Local Storage) de waarde van `tafels-elfje-v1` op `{` en herlaad: de app start leeg, maar `tafels-elfje-v1-corrupt` bevat de oorspronkelijke tekst en `tafels-elfje-v1` is niet gewist.

## Een snapshot terugzetten

Elke dag heeft een document `saves/{uid}/snapshots/{YYYY-MM-DD}` met de laatste stand van die dag. Terugzetten:

1. Open het snapshot in de Firestore-console en kopieer de waarde van het veld `json`.
2. Plak die in een bestand `herstel.json` op het apparaat.
3. Ouderoverzicht → "Back-up terugzetten" → kies `herstel.json`. De app neemt de voortgang over en uploadt hem daarna als nieuwste stand.
````

- [ ] **Step 9: Verwijs vanuit de README**

Voeg in `README.md` na het blok onder `## Deploy` (dus na de regel die begint met `Vercel herkent het project als Vite`) een nieuw hoofdstuk toe:

```markdown

## Cloud-opslag (optioneel)

De voortgang kan ook in Firebase bewaard worden, zodat een gewist of vervangen apparaat geen voortgang kost. Zie `docs/firebase-setup.md`.
```

- [ ] **Step 10: Run alle tests, de typecheck en de build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: PASS; de build-output toont aparte chunks voor de Firebase-SDK (lazy geladen).

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/cloud/client.ts src/cloud/client.test.ts src/cloud/auth.ts src/cloud/store.ts src/cloud/guard.ts src/cloud/guard.test.ts firestore.rules docs/firebase-setup.md README.md
git commit -m "$(cat <<'EOF'
Add the Firebase adapter, security rules and setup guide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
---

### Task 6: `statusText` en `CloudProvider` (engine aan de app koppelen)

**Files:**
- Create: `src/cloud/statusText.ts`, `src/cloud/statusText.test.ts`
- Create: `src/cloud/CloudProvider.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `SyncEngine`, `SyncStatus`, `StartOutcome` (`./sync`); `firestoreStore` (`./store`); `cloudConfigured` (`./client`); `* as auth` (`./auth`); `useStore` (`../state/store`); `keepReplaced` (`../logic/storage`); `dispatch({ type: 'restore', data })` (Task 1).
- Produces: `statusText(status: SyncStatus): string`; `CloudProvider`; `useCloud(): Cloud` met
  `{ configured: boolean; signedIn: boolean; status: SyncStatus; signIn(email: string, password: string): Promise<StartOutcome>; signOut(): Promise<void>; removeRemote(): Promise<void> }`.

- [ ] **Step 1: Schrijf de falende test voor `statusText`**

Maak `src/cloud/statusText.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { statusText } from './statusText';

describe('statusText', () => {
  it('geeft voor elke status een Nederlandse tekst', () => {
    expect(statusText({ kind: 'off' })).toBe('Niet ingesteld');
    expect(statusText({ kind: 'signedOut' })).toBe('Niet ingelogd');
    expect(statusText({ kind: 'syncing' })).toBe('Bezig met opslaan…');
    expect(statusText({ kind: 'offline' })).toBe('Offline, wordt later opgeslagen');
    expect(statusText({ kind: 'error' })).toBe('Opslaan mislukt, wordt opnieuw geprobeerd');
  });

  it('toont bij synced het tijdstip', () => {
    expect(statusText({ kind: 'synced', at: '2026-09-23T12:32:00.000Z' })).toMatch(/^Laatst opgeslagen \d{1,2}[:.]\d{2}/);
  });
});
```

- [ ] **Step 2: Run de test en controleer dat hij faalt**

Run: `npx vitest run src/cloud/statusText.test.ts`
Expected: FAIL (module bestaat niet).

- [ ] **Step 3: Implementeer `statusText.ts`**

Maak `src/cloud/statusText.ts`:

```ts
import type { SyncStatus } from './sync';

const time = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

export function statusText(status: SyncStatus): string {
  switch (status.kind) {
    case 'off':
      return 'Niet ingesteld';
    case 'signedOut':
      return 'Niet ingelogd';
    case 'syncing':
      return 'Bezig met opslaan…';
    case 'synced':
      return `Laatst opgeslagen ${time(status.at)}`;
    case 'offline':
      return 'Offline, wordt later opgeslagen';
    case 'error':
      return 'Opslaan mislukt, wordt opnieuw geprobeerd';
  }
}
```

- [ ] **Step 4: Run de test en controleer dat hij slaagt**

Run: `npx vitest run src/cloud/statusText.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implementeer `CloudProvider.tsx`**

Maak `src/cloud/CloudProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { keepReplaced } from '../logic/storage';
import { useStore } from '../state/store';
import * as auth from './auth';
import { cloudConfigured } from './client';
import { firestoreStore } from './store';
import { SyncEngine, type StartOutcome, type SyncStatus } from './sync';

interface Cloud {
  configured: boolean;
  signedIn: boolean;
  status: SyncStatus;
  /** Logt in en synchroniseert meteen; geeft terug wat er met de voortgang gebeurde. */
  signIn(email: string, password: string): Promise<StartOutcome>;
  signOut(): Promise<void>;
  /** Verwijdert de cloudkopie (bij "Alles wissen"). Doet niets als er niet is ingelogd; gooit bij een fout. */
  removeRemote(): Promise<void>;
}

const CloudContext = createContext<Cloud | null>(null);

export function CloudProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore();
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(cloudConfigured ? { kind: 'signedOut' } : { kind: 'off' });

  const saveRef = useRef(state.save);
  saveRef.current = state.save;

  const engine = useMemo(
    () =>
      new SyncEngine({
        store: firestoreStore,
        getLocal: () => saveRef.current,
        restore: (data) => dispatch({ type: 'restore', data }),
        keepReplaced: (save) => keepReplaced(save),
        onStatus: setStatus,
        isOnline: () => navigator.onLine,
      }),
    [dispatch],
  );

  useEffect(() => {
    if (!cloudConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    auth
      .onAuthChange(setSignedIn)
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!cloudConfigured) return;
    if (signedIn) void engine.start();
    else {
      engine.stop();
      setStatus({ kind: 'signedOut' });
    }
  }, [signedIn, engine]);

  useEffect(() => () => engine.stop(), [engine]);

  useEffect(() => {
    if (signedIn) engine.notifyChanged();
  }, [state.save, signedIn, engine]);

  useEffect(() => {
    if (!signedIn) return;
    const flush = () => void engine.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', flush);
    };
  }, [signedIn, engine]);

  const value = useMemo<Cloud>(
    () => ({
      configured: cloudConfigured,
      signedIn,
      status,
      async signIn(email, password) {
        await auth.signIn(email, password);
        return engine.start();
      },
      async signOut() {
        engine.stop();
        await auth.signOut();
      },
      async removeRemote() {
        if (signedIn) await engine.removeRemote();
      },
    }),
    [signedIn, status, engine],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud(): Cloud {
  const c = useContext(CloudContext);
  if (!c) throw new Error('useCloud buiten CloudProvider');
  return c;
}
```

- [ ] **Step 6: Koppel de provider in `main.tsx`**

Voeg de import toe na `import { StoreProvider } from './state/store';`:

```tsx
import { CloudProvider } from './cloud/CloudProvider';
```

en vervang

```tsx
    <StoreProvider>
      <App />
    </StoreProvider>
```

door:

```tsx
    <StoreProvider>
      <CloudProvider>
        <App />
      </CloudProvider>
    </StoreProvider>
```

- [ ] **Step 7: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, geen typefouten.

- [ ] **Step 8: Controleer in de browser dat de app zonder Firebase-configuratie ongewijzigd werkt**

Start `preview_start` met `{name: "tafels"}` (geen env-variabelen gezet). Open `http://localhost:5173`, maak een profiel aan, speel een ronde. Controleer met `read_network_requests` dat er geen requests naar `googleapis.com` of `firebaseio.com` gaan en met `read_console_messages` (alleen errors) dat er geen fouten zijn. Sluit daarna de tab (`tabs_close`) en stop de server (`preview_stop`).

- [ ] **Step 9: Commit**

```bash
git add src/cloud/statusText.ts src/cloud/statusText.test.ts src/cloud/CloudProvider.tsx src/main.tsx
git commit -m "$(cat <<'EOF'
Wire the cloud sync engine into the app through a CloudProvider

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Ouderoverzicht: cloud-paneel, inlogformulier en wissen inclusief cloudkopie

**Files:**
- Create: `src/components/CloudLogin.tsx`
- Create: `src/screens/CloudPanel.tsx`
- Modify: `src/screens/Parent.tsx`

**Interfaces:**
- Consumes: `useCloud()` (Task 6); `statusText` (Task 6); `StartOutcome` (Task 4).
- Produces: `CloudLogin({ onDone?: (outcome: StartOutcome) => void })`; `CloudPanel()`.

- [ ] **Step 1: Maak `CloudLogin.tsx`**

Maak `src/components/CloudLogin.tsx`:

```tsx
import { useState } from 'react';
import { useCloud } from '../cloud/CloudProvider';
import type { StartOutcome } from '../cloud/sync';

/** E-mail en wachtwoord van het ouderaccount (aangemaakt in de Firebase-console). */
export function CloudLogin({ onDone }: { onDone?: (outcome: StartOutcome) => void }) {
  const cloud = useCloud();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const outcome = await cloud.signIn(email.trim(), password);
      if (outcome === 'failed') {
        setError('Ingelogd, maar de voortgang ophalen lukte niet. Het wordt zo nog eens geprobeerd.');
        return;
      }
      onDone?.(outcome);
    } catch {
      setError('Inloggen mislukt. Klopt het e-mailadres en wachtwoord, en is er internet?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="cloud-login"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <input
        className="text-input small"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mailadres van de ouder"
        aria-label="e-mailadres"
        disabled={busy}
      />
      <input
        className="text-input small"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Wachtwoord"
        aria-label="wachtwoord"
        disabled={busy}
      />
      <button className="btn btn-primary btn-small" type="submit" disabled={!email.includes('@') || !password || busy}>
        Inloggen
      </button>
      {error && <p className="note">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Maak `CloudPanel.tsx`**

Maak `src/screens/CloudPanel.tsx`:

```tsx
import { CloudLogin } from '../components/CloudLogin';
import { useCloud } from '../cloud/CloudProvider';
import { statusText } from '../cloud/statusText';

export function CloudPanel() {
  const cloud = useCloud();
  return (
    <section className="panel">
      <h2>Cloud-opslag</h2>
      <p className="muted">
        Bewaart de voortgang ook buiten dit apparaat, zodat een gewist of vervangen apparaat geen voortgang kost.
      </p>
      <p className="note">{statusText(cloud.status)}</p>
      {!cloud.configured ? (
        <p className="muted">Instellen? Zie docs/firebase-setup.md.</p>
      ) : cloud.signedIn ? (
        <button className="btn btn-white btn-small" onClick={() => void cloud.signOut()}>
          Uitloggen
        </button>
      ) : (
        <CloudLogin />
      )}
    </section>
  );
}
```

- [ ] **Step 3: Voeg het paneel toe en laat "Alles wissen" ook de cloudkopie wissen**

In `src/screens/Parent.tsx` voeg imports toe na `import { previewMusicVolume } from '../music';`:

```tsx
import { useCloud } from '../cloud/CloudProvider';
import { CloudPanel } from './CloudPanel';
```

Voeg in `Parent()` na `const { save, dispatch, today } = useSave();` toe: `const cloud = useCloud();`.

Vervang de bestaande `reset`-functie:

```tsx
  const reset = () => {
    if (confirm('Weet je zeker dat je ALLE voortgang wilt wissen?') && confirm('Echt zeker? Dit kan niet ongedaan worden (tenzij je een back-up hebt).')) {
      dispatch({ type: 'reset' });
    }
  };
```

door:

```tsx
  const reset = async () => {
    const extra = cloud.signedIn ? ' Ook de kopie in de cloud wordt gewist.' : '';
    if (!confirm(`Weet je zeker dat je ALLE voortgang wilt wissen?${extra}`)) return;
    if (!confirm('Echt zeker? Dit kan niet ongedaan worden (tenzij je een back-up hebt).')) return;
    try {
      await cloud.removeRemote();
    } catch {
      setMsg('De kopie in de cloud kon niet gewist worden. Probeer het opnieuw met internet.');
      return;
    }
    dispatch({ type: 'reset' });
  };
```

Voeg vóór `<section className="panel">` met `<h2>Back-up</h2>` toe:

```tsx
        <CloudPanel />

```

- [ ] **Step 4: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, geen typefouten.

- [ ] **Step 5: Controleer in de browser zonder configuratie**

`preview_start` met `{name: "tafels"}`. Zet via `javascript_exec` een save in `localStorage` (zoals bij eerdere controles: `version: 1`, `elfName`, `settings` inclusief `musicVolume: 1` en `dailyLimitMinutes: null`, `updatedAt` en `createdAt` als ISO-string) en herlaad één keer. Open het Ouderoverzicht (slot-icoon, los de rekensom op) en controleer: het paneel "Cloud-opslag" toont "Niet ingesteld" en "Instellen? Zie docs/firebase-setup.md." en er is geen inlogformulier. Sluit de tab en stop de server.

- [ ] **Step 6: Controleer het inlogformulier met een dummy-configuratie**

Start een tweede dev-server met dummy-variabelen. Run (op de achtergrond): `VITE_FIREBASE_API_KEY=dummy VITE_FIREBASE_AUTH_DOMAIN=voorbeeld.invalid VITE_FIREBASE_PROJECT_ID=voorbeeld VITE_FIREBASE_APP_ID=dummy npx vite --port 5174 --strictPort`. Open `http://localhost:5174` met een verse tab, zet dezelfde save in `localStorage`, herlaad, open het Ouderoverzicht. Controleer: status "Niet ingelogd", het formulier toont een e-mail- en wachtwoordveld en "Inloggen" is uitgeschakeld tot er een `@` in het e-mailveld staat én een wachtwoord is ingevuld. Vul `a@b.nl` en `geheim` in en klik "Inloggen": er verschijnt de foutmelding "Inloggen mislukt. Klopt het e-mailadres en wachtwoord, en is er internet?" (de dummy-config is ongeldig). Sluit de tab, stop de dev-server op poort 5174.

- [ ] **Step 7: Commit**

```bash
git add src/components/CloudLogin.tsx src/screens/CloudPanel.tsx src/screens/Parent.tsx
git commit -m "$(cat <<'EOF'
Add the cloud panel to the parent overview and wipe the cloud copy on reset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Herstelpad op het Welcome-scherm

**Files:**
- Create: `src/components/MathGate.tsx`
- Modify: `src/screens/ParentGate.tsx`
- Modify: `src/screens/Welcome.tsx`

**Interfaces:**
- Consumes: `CloudLogin` (Task 7), `useCloud()` (Task 6), `StartOutcome` (Task 4).
- Produces: `MathGate({ onPass }: { onPass: () => void })`.

- [ ] **Step 1: Haal de rekensom uit `ParentGate` naar `MathGate`**

Maak `src/components/MathGate.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { say } from '../audio';
import { NumPad } from './NumPad';

const rnd = () => 12 + Math.floor(Math.random() * 8);

/** Een som die een kind van 8 nog niet uit het hoofd kan. */
export function MathGate({ onPass }: { onPass: () => void }) {
  const [q, setQ] = useState(() => ({ a: rnd(), b: rnd() }));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  useEffect(() => say('ouders'), []);

  return (
    <div className="round-body">
      <div className="round-left">
        <p className="big">Dit deel is voor papa of mama. Los deze som op:</p>
        <div className="question">
          {q.a}
          <span className="op">×</span>
          {q.b}
          <span className="op">=</span>
          <span className={`answer-box ${input ? '' : 'answer-empty'}`}>{input || '?'}</span>
        </div>
        {wrong && <p className="big">Dat klopt niet. Probeer deze:</p>}
      </div>
      <div className="round-right">
        <NumPad
          value={input}
          onChange={setInput}
          onSubmit={(value) => {
            if (Number(value) === q.a * q.b) onPass();
            else {
              setWrong(true);
              setInput('');
              setQ({ a: rnd(), b: rnd() });
            }
          }}
        />
      </div>
    </div>
  );
}
```

Vervang de volledige inhoud van `src/screens/ParentGate.tsx` door:

```tsx
import { MathGate } from '../components/MathGate';
import { TopBar } from '../components/TopBar';
import type { Go } from '../nav';

export function ParentGate({ go }: { go: Go }) {
  return (
    <div className="screen gate">
      <TopBar onBack={() => go({ name: 'home' })} title="Voor ouders" />
      <MathGate onPass={() => go({ name: 'parent' })} />
    </div>
  );
}
```

- [ ] **Step 2: Controleer dat het Ouderoverzicht nog bereikbaar is**

Run: `npx tsc --noEmit`
Expected: geen typefouten.

- [ ] **Step 3: Voeg het herstelpad toe aan `Welcome.tsx`**

Voeg imports toe in `src/screens/Welcome.tsx` (na `import { CHILD_NAME } from '../data/phrases';`):

```tsx
import { CloudLogin } from '../components/CloudLogin';
import { MathGate } from '../components/MathGate';
import { TopBar } from '../components/TopBar';
import { useCloud } from '../cloud/CloudProvider';
```

Vervang de kop van de component:

```tsx
export function Welcome() {
  const { dispatch } = useStore();
  const [elf, setElf] = useState('');

  useEffect(() => say('welkom-1'), []);

  return (
```

door:

```tsx
export function Welcome() {
  const { dispatch } = useStore();
  const cloud = useCloud();
  const [elf, setElf] = useState('');
  const [mode, setMode] = useState<'setup' | 'gate' | 'restore'>('setup');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => say('welkom-1'), []);

  if (mode === 'gate') {
    return (
      <div className="screen gate">
        <TopBar onBack={() => setMode('setup')} title="Voor ouders" />
        <MathGate onPass={() => setMode('restore')} />
      </div>
    );
  }

  if (mode === 'restore') {
    return (
      <div className="screen welcome">
        <div className="card welcome-card">
          <h1>Voortgang herstellen</h1>
          <p className="big">Log in met het e-mailadres van de ouder om de opgeslagen voortgang terug te halen.</p>
          <CloudLogin onDone={(outcome) => setNotFound(outcome === 'none')} />
          {notFound && <p className="note">Geen opgeslagen voortgang gevonden voor dit account.</p>}
          <button className="btn btn-white btn-small" onClick={() => setMode('setup')}>
            Terug
          </button>
        </div>
      </div>
    );
  }

  return (
```

Voeg in het kaartje van de standaardweergave, direct na de `Beginnen`-knop (`</button>` vóór `</div>` dat de `welcome-card` sluit), toe:

```tsx
        {cloud.configured && (
          <button className="btn btn-white btn-small" onClick={() => setMode('gate')}>
            Ouder? Voortgang herstellen
          </button>
        )}
```

Bij een geslaagd herstel wordt `state.save` gezet (actie `restore`) en toont `App` automatisch de kaart; er is geen extra navigatie nodig.

- [ ] **Step 4: Run alle tests en de typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, geen typefouten.

- [ ] **Step 5: Controleer in de browser**

Zonder configuratie: `preview_start` `{name: "tafels"}`, wis `localStorage`, herlaad: het Welcome-scherm toont geen "Ouder? Voortgang herstellen"-knop. Open daarna het Ouderoverzicht met een bestaande save en controleer dat de rekensom nog werkt (goed antwoord opent het overzicht, fout antwoord toont een nieuwe som). Met dummy-configuratie (dev-server op poort 5174 met `VITE_FIREBASE_API_KEY=dummy VITE_FIREBASE_AUTH_DOMAIN=voorbeeld.invalid VITE_FIREBASE_PROJECT_ID=voorbeeld VITE_FIREBASE_APP_ID=dummy`): wis `localStorage`, herlaad, controleer dat de knop er is, klik erop, los de rekensom op, en controleer dat het formulier "Voortgang herstellen" verschijnt met "Terug" die naar het profiel-aanmaken teruggaat. Sluit alle tabs en stop beide servers.

- [ ] **Step 6: Commit**

```bash
git add src/components/MathGate.tsx src/screens/ParentGate.tsx src/screens/Welcome.tsx
git commit -m "$(cat <<'EOF'
Add a parent-gated restore path to the welcome screen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Eindcontrole

**Files:** geen nieuwe.

- [ ] **Step 1: Volledige controle**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: alle tests PASS, geen typefouten, build slaagt met aparte chunks voor de Firebase-SDK.

- [ ] **Step 2: Controleer dat er geen geheimen zijn vastgelegd**

Run: `git status && git grep -n "AIza" -- . ':!package-lock.json' ':!docs' | head`
Expected: schone working tree (of alleen bedoelde wijzigingen) en geen echte Firebase-API-sleutel in de code (de docs bevatten bewust alleen de placeholder `AIza...`).

- [ ] **Step 3: Draai de handmatige controlelijst met het echte Firebase-project**

Dit doet de gebruiker na het instellen volgens `docs/firebase-setup.md` (sectie "Handmatig controleren", 6 punten). Meld resultaten of problemen terug, dan pas pushen.
