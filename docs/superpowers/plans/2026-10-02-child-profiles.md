# Kindprofielen, tijdtimer en sterren-fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lucy kan op een eigen apparaat inloggen en krijgt haar eigen naam in tekst en audio, een eigen startstand en eigen regels voor nieuwe sommen; alle kinderen krijgen een kleine tijdtimer en een duidelijker sterren-eindscherm.

**Architecture:** Een profielenlijst (`src/data/profiles.ts`) koppelt een e-mailadres aan een kind (naam, uitspraak, startstand, limieten voor nieuwe sommen). `SaveData.profileId` onthoudt van wie een save is. Het actieve profiel staat in een module-variabele (zelfde patroon als `setAudioPrefs`) die tekst en audio gebruiken. Het welkomstscherm krijgt een inlogstap vooraf.

**Tech Stack:** React 18, Vite, TypeScript strict (`noUnusedLocals`), Vitest (omgeving `node`, dus geen component-tests), Firebase Auth/Firestore (bestaande sync), tsx-script voor ElevenLabs-audio.

**Spec:** `docs/superpowers/specs/2026-10-02-child-profiles-design.md`

## Global Constraints

- Alle zichtbare tekst is Nederlands; code-identifiers en commentaar volgen de bestaande stijl (Nederlands commentaar, Engelse namen).
- Floor hoort bij `yoridewit@pm.me`, Lucy bij `lucy@tafels.nl`; een ander adres hoort bij geen kind en wordt op het inlogscherm geweigerd.
- Een bestaande save zonder `profileId` geldt als Floor; Floors spel en audio veranderen niet.
- Lucy: tafel 1 en 10 gekend; tafel 2 max 2 nieuwe sommen per ronde en 5 per dag; vanaf tafel 5 (eiland 2) max 1 per ronde en 2 per dag, net als Floor.
- Floor: eiland 0 en 1 max 3 per ronde (geen daglimiet); vanaf eiland 2 max 1 per ronde en 2 per dag.
- Nieuwe saves starten met `dailyLimitMinutes: 10`; bestaande saves behouden hun instelling (`parseSave` zet een ontbrekende waarde op `null`).
- `STARS.roundDone` wordt 6; bonus eerste ronde van de dag blijft 5; de kwartregel vanaf de vierde ronde van de dag blijft.
- Tijdens een ronde en in het snelspel staat geen timer en geen sterren-teller met "+1".
- Commit-berichten eindigen met `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Tests: `npx vitest run`; typecheck: `npx tsc --noEmit -p .`. Beide moeten na elke taak groen zijn.

---

### Task 1: Sterren: totaal aan het einde van de ronde

**Files:**
- Modify: `src/state/reducer.ts` (STARS, `roundReward`, nieuwe `roundBreakdown`)
- Modify: `src/state/reducer.test.ts:40-56` (reward-tests)
- Modify: `src/screens/RoundScreen.tsx:184-192` (verwijder het "+1")
- Modify: `src/screens/RoundResult.tsx` (toon opbouw)
- Modify: `src/styles.css` (stijl voor de opbouw, bij `.score-tile`, rond regel 1337)

**Interfaces:**
- Produces: `roundBreakdown(correct: number, roundsBefore: number): RoundBreakdown` met
  `{ correctStars: number; roundBonus: number; firstRoundBonus: number; reduced: boolean; total: number }`;
  `roundReward(correct, roundsBefore)` blijft bestaan en geeft `roundBreakdown(...).total`.

- [ ] **Step 1: Pas de reward-tests aan en voeg een opbouw-test toe**

Vervang in `src/state/reducer.test.ts` de drie tests `round reward: …`, `from the fourth round…` en `finishRound pays the reduced reward…` door:

```ts
  it('round reward: 1 per correct + 6, +5 for first round of the day', () => {
    expect(roundReward(8, 0)).toBe(19);
    expect(roundReward(8, 1)).toBe(14);
    expect(roundReward(8, 2)).toBe(14);
  });

  it('from the fourth round of the day the reward is a quarter', () => {
    expect(roundReward(8, 3)).toBe(4);
    expect(roundReward(10, 7)).toBe(4);
    expect(roundReward(0, 3)).toBe(2);
  });

  it('roundBreakdown explains the total', () => {
    expect(roundBreakdown(10, 0)).toEqual({ correctStars: 10, roundBonus: 6, firstRoundBonus: 5, reduced: false, total: 21 });
    expect(roundBreakdown(10, 1)).toEqual({ correctStars: 10, roundBonus: 6, firstRoundBonus: 0, reduced: false, total: 16 });
    expect(roundBreakdown(10, 3)).toEqual({ correctStars: 10, roundBonus: 6, firstRoundBonus: 0, reduced: true, total: 4 });
  });

  it('finishRound pays the reduced reward after three rounds today', () => {
    let s = started();
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'finishRound', correct: 8, today: T });
    const before = s.save!.stars;
    s = reducer(s, { type: 'finishRound', correct: 8, today: T });
    expect(s.save!.stars - before).toBe(4);
  });
```

Pas de import bovenin aan: `import { reducer, initialState, roundBreakdown, roundReward, stampedReducer, type Action, type AppState } from './reducer';`

- [ ] **Step 2: Draai de tests, ze moeten falen**

Run: `npx vitest run src/state/reducer.test.ts`
Expected: FAIL (`roundBreakdown` bestaat niet; oude bedragen).

- [ ] **Step 3: Implementeer in `reducer.ts`**

Vervang het blok `export const STARS … roundReward` door:

```ts
export const STARS = { perCorrect: 1, roundDone: 6, firstRoundOfDay: 5, fullRoundsPerDay: 3 };

export interface RoundBreakdown {
  correctStars: number;
  roundBonus: number;
  firstRoundBonus: number;
  /** Vanaf de vierde ronde van de dag krijgt het kind nog een kwart (kort en vaak, niet eindeloos). */
  reduced: boolean;
  total: number;
}

export function roundBreakdown(correct: number, roundsBefore: number): RoundBreakdown {
  const correctStars = correct * STARS.perCorrect;
  const roundBonus = STARS.roundDone;
  const firstRoundBonus = roundsBefore === 0 ? STARS.firstRoundOfDay : 0;
  const full = correctStars + roundBonus + firstRoundBonus;
  const reduced = roundsBefore >= STARS.fullRoundsPerDay;
  return { correctStars, roundBonus, firstRoundBonus, reduced, total: reduced ? Math.ceil(full / 4) : full };
}

/** Sterren voor een ronde; zie `roundBreakdown`. */
export function roundReward(correct: number, roundsBefore: number): number {
  return roundBreakdown(correct, roundsBefore).total;
}
```

- [ ] **Step 4: Draai de tests, ze moeten slagen**

Run: `npx vitest run src/state/reducer.test.ts`
Expected: PASS.

- [ ] **Step 5: Haal het "+1" uit `RoundScreen.tsx`**

Verwijder in de `phase === 'right'`-feedback het blok

```tsx
                <span className="star-plus">
                  <Icon name="star" size={20} />
                  +1
                </span>
```

(`Icon` blijft gebruikt elders in dit bestand; als `tsc` een ongebruikte import meldt, verwijder die.) Het stijlblok `.star-plus` in `styles.css` mag blijven staan als het nergens anders gebruikt wordt; zoek met `grep -rn "star-plus" src` en verwijder de CSS-regels als er geen gebruik meer is.

- [ ] **Step 6: Toon de opbouw op het eindscherm**

In `src/screens/RoundResult.tsx`: voeg `import { roundBreakdown } from '../state/reducer';` toe. Bereken in de component, onder `const roundsToday = …`:

```tsx
  // `finishRound` is al verwerkt: het aantal rondes van vandaag bevat deze ronde.
  const breakdown = roundBreakdown(correct, Math.max(0, roundsToday - 1));
```

Vervang de gouden tegel door:

```tsx
          <div className="score-tile gold">
            <strong>
              <Icon name="star" size={28} />+{stars}
            </strong>
            <span>sterren verdiend</span>
          </div>
        </div>
        <p className="star-sum">
          {breakdown.correctStars} goed · ronde af +{breakdown.roundBonus}
          {breakdown.firstRoundBonus > 0 && ` · eerste ronde van de dag +${breakdown.firstRoundBonus}`}
          {breakdown.reduced && ' · extra ronde: een kwart van de sterren'}
        </p>
```

(Het bestaande `</div>` van `score-row` blijft op de plek vóór de `<p>`; let op dat de `<p>` ná dat sluitende `</div>` komt, zoals hierboven.) Voeg in `styles.css` onder `.score-tile.gold .icon`:

```css
.star-sum {
  text-align: center;
  font-size: 1rem;
  color: var(--ink-soft, var(--ink));
  margin: 0;
}
```

- [ ] **Step 7: Controleer typecheck en alle tests**

Run: `npx tsc --noEmit -p . && npx vitest run`
Expected: geen typefouten, alles PASS.

- [ ] **Step 8: Commit**

```bash
git add src/state/reducer.ts src/state/reducer.test.ts src/screens/RoundScreen.tsx src/screens/RoundResult.tsx src/styles.css
git commit -m "Show the star total at the end of a round and raise the round bonus to 6

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tijdtimer en standaardlimiet van 10 minuten

**Files:**
- Modify: `src/logic/timeLimit.ts` (nieuwe `remainingMinutes`)
- Modify: `src/logic/timeLimit.test.ts`
- Modify: `src/logic/storage.ts:59` (`dailyLimitMinutes: 10`)
- Modify: `src/state/reducer.test.ts:132` (verwachte instelling)
- Modify: `src/components/Icon.tsx` (icoon `clock`)
- Create: `src/components/TimeChip.tsx`
- Modify: `src/components/TopBar.tsx` (prop `timer`)
- Modify: `src/screens/Home.tsx`, `src/screens/RoundResult.tsx` (timer toevoegen)
- Modify: `src/screens/RoundScreen.tsx`, `src/screens/SpeedGame.tsx` (`timer={false}`)
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `remainingMinutes(save: SaveData, today: string): number | null` — `null` zonder limiet, anders `max(0, ceil(limit − minutesToday))`.
  `<TimeChip />` — rendert niets zonder save of zonder limiet. `TopBar` krijgt `timer?: boolean` (standaard `true`).

- [ ] **Step 1: Schrijf de falende tests**

Voeg onderaan de bovenste `describe('timeLimit', …)` in `src/logic/timeLimit.test.ts` toe (en importeer `remainingMinutes`):

```ts
  describe('remainingMinutes', () => {
    const withLimit = (limit: number | null, usedMin: number) => ({
      ...emptySave(),
      timeByDay: { [T]: usedMin * 60_000 },
      settings: { ...emptySave().settings, dailyLimitMinutes: limit },
    });

    it('is null without a limit', () => {
      expect(remainingMinutes(withLimit(null, 3), T)).toBeNull();
    });

    it('counts down, rounding up to whole minutes', () => {
      expect(remainingMinutes(withLimit(10, 0), T)).toBe(10);
      expect(remainingMinutes(withLimit(10, 2.5), T)).toBe(8);
      expect(remainingMinutes(withLimit(10, 9.9), T)).toBe(1);
    });

    it('never goes below zero', () => {
      expect(remainingMinutes(withLimit(10, 10), T)).toBe(0);
      expect(remainingMinutes(withLimit(10, 25), T)).toBe(0);
    });
  });

  it('a fresh save has a ten minute limit', () => {
    expect(emptySave().settings.dailyLimitMinutes).toBe(10);
  });
```

Pas in dezelfde file de tests aan die uitgingen van "geen limiet" bij `emptySave()`:
in `timeUpToday is false without a limit…` is `save` gebaseerd op `emptySave()` met 20 min gebruikt en daarna wordt `dailyLimitMinutes` expliciet gezet; voeg bovenaan die test `const none = { ...save, settings: { ...save.settings, dailyLimitMinutes: null } }; expect(timeUpToday(none, T)).toBe(false);` toe en laat de eerste `expect(timeUpToday(save, T)).toBe(false)` vervallen (want `save` heeft nu limiet 10). In `allowedScreen` → `lets a round start while there is time left or no limit` vervang `emptySave()` door `{ ...emptySave(), settings: { ...emptySave().settings, dailyLimitMinutes: null } }`.

In `src/state/reducer.test.ts:132` verandert de verwachte `dailyLimitMinutes: null` in `dailyLimitMinutes: 10`.

- [ ] **Step 2: Draai de tests, ze moeten falen**

Run: `npx vitest run src/logic/timeLimit.test.ts src/state/reducer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementeer de logica**

In `src/logic/timeLimit.ts` toevoegen:

```ts
/** Resterende speeltijd van vandaag in hele minuten (naar boven afgerond); null zonder limiet. */
export function remainingMinutes(save: SaveData, today: string): number | null {
  const limit = save.settings.dailyLimitMinutes;
  if (limit == null) return null;
  return Math.max(0, Math.ceil(limit - minutesToday(save, today)));
}
```

In `src/logic/storage.ts` regel 59: `dailyLimitMinutes: 10`.

- [ ] **Step 4: Draai de tests, ze moeten slagen**

Run: `npx vitest run`
Expected: PASS. Tests die buiten de hierboven genoemde bestanden op `null` rekenen: pas ze aan met een expliciete `dailyLimitMinutes: null`.

- [ ] **Step 5: Icoon, component en TopBar**

`src/components/Icon.tsx`: voeg in `PATHS` toe (na `user`):

```tsx
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
```

`src/components/TimeChip.tsx`:

```tsx
import { Icon } from './Icon';
import { remainingMinutes } from '../logic/timeLimit';
import { useStore } from '../state/store';

/** Kleine aftelklok met de resterende speeltijd van vandaag; niets zonder limiet. */
export function TimeChip() {
  const { state, today } = useStore();
  const minutes = state.save ? remainingMinutes(state.save, today) : null;
  if (minutes === null) return null;
  return (
    <span className="chip-stat chip-time" aria-label={`nog ${minutes} minuten speeltijd`} title="speeltijd vandaag">
      <Icon name="clock" />
      {minutes} min
    </span>
  );
}
```

`src/components/TopBar.tsx`: voeg `timer?: boolean;` toe aan `Props`, importeer `TimeChip`, destructureer `timer = true` en zet in `topbar-left` na de terugknop en vóór `{left}`: `{timer && <TimeChip />}`.

`src/screens/RoundScreen.tsx` (`<TopBar … />`) en `src/screens/SpeedGame.tsx` (`<TopBar … />`): voeg `timer={false}` toe.

`src/screens/Home.tsx`: importeer `TimeChip` en zet hem in `topbar-left` na het vlam-chipje.

`src/screens/RoundResult.tsx`: importeer `TimeChip`; zet als eerste kind van `<div className="screen result">` `<div className="result-timer"><TimeChip /></div>`.

`src/styles.css`, na `.chip-streak .icon`:

```css
.chip-time {
  height: 40px;
  font-size: 1rem;
  padding: 0 12px 0 10px;
}
.chip-time .icon {
  width: 20px;
  height: 20px;
  color: var(--purple, #8b5cf6);
}
.result-timer {
  position: absolute;
  top: 12px;
  left: 12px;
}
```

(Controleer in de browser dat `.screen.result` een positioneringscontext heeft; voeg anders `position: relative` toe aan `.screen.result`.)

- [ ] **Step 6: Typecheck, tests, browsercontrole**

Run: `npx tsc --noEmit -p . && npx vitest run`. Start daarna de dev-server (`preview_start` met naam `tafels`) en controleer: timer zichtbaar op de kaart, in de winkel en op het eindscherm; niet in een ronde en niet in het snelspel; geen timer als de limiet in het ouderscherm op "geen" staat.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "Add a remaining-time chip and default new saves to a ten minute limit

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Profielen, `profileId` en Lucy's startstand

**Files:**
- Create: `src/data/profiles.ts`
- Create: `src/data/profiles.test.ts`
- Modify: `src/logic/storage.ts` (`profileId`, `emptySave`, `parseSave`)
- Modify: `src/logic/storage.test.ts`
- Modify: `src/state/reducer.ts` (`setup`-actie)
- Modify: `src/state/reducer.test.ts`

**Interfaces:**
- Produces (in `profiles.ts`):

```ts
export type ProfileId = 'floor' | 'lucy';
export interface IslandLimits { perRound: number; perDay: number | null }
export interface ChildProfile {
  id: ProfileId;
  email: string;
  name: string;
  spokenName: string;
  audioDir: string | null;
  knownIslands: number[];
  newFacts: Partial<Record<number, IslandLimits>>;
}
export const PROFILES: ChildProfile[];
export const FLOOR: ChildProfile;
export function profileById(id: unknown): ChildProfile;            // onbekend of ontbrekend → FLOOR
export function profileForEmail(email: string): ChildProfile | null; // trim + lowercase
export function activeProfile(): ChildProfile;                       // module-variabele, standaard FLOOR
export function setActiveProfile(p: ChildProfile): void;
```

  `SaveData.profileId: ProfileId`; `emptySave(elfName = '', profile: ChildProfile = FLOOR): SaveData`;
  reducer-actie `{ type: 'setup'; elfName: string; profileId?: ProfileId }`.
- Consumes: niets uit eerdere taken.

- [ ] **Step 1: Schrijf de falende tests**

`src/data/profiles.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FLOOR, PROFILES, activeProfile, profileById, profileForEmail, setActiveProfile } from './profiles';

describe('profiles', () => {
  it('maps e-mail addresses to children, ignoring case and spaces', () => {
    expect(profileForEmail('yoridewit@pm.me')?.id).toBe('floor');
    expect(profileForEmail('  Lucy@Tafels.nl ')?.id).toBe('lucy');
  });

  it('rejects an unknown e-mail address', () => {
    expect(profileForEmail('iemand@anders.nl')).toBeNull();
    expect(profileForEmail('')).toBeNull();
  });

  it('falls back to Floor for a missing or unknown id', () => {
    expect(profileById(undefined)).toBe(FLOOR);
    expect(profileById('xyz')).toBe(FLOOR);
    expect(profileById('lucy').name).toBe('Lucy');
  });

  it('Lucy is spoken as Lusie and has her own audio folder', () => {
    const lucy = profileById('lucy');
    expect(lucy.spokenName).toBe('Lusie');
    expect(lucy.audioDir).toBe('lucy');
    expect(FLOOR.audioDir).toBeNull();
  });

  it('keeps one profile per id and per e-mail', () => {
    expect(new Set(PROFILES.map((p) => p.id)).size).toBe(PROFILES.length);
    expect(new Set(PROFILES.map((p) => p.email)).size).toBe(PROFILES.length);
  });

  it('tracks the active profile', () => {
    expect(activeProfile()).toBe(FLOOR);
    setActiveProfile(profileById('lucy'));
    expect(activeProfile().id).toBe('lucy');
    setActiveProfile(FLOOR);
  });
});
```

Voeg toe aan `src/logic/storage.test.ts` (importeer `profileById` uit `'../data/profiles'`, `isKnown` uit `'./leitner'`, `factsForIsland` uit `'./facts'`, `computeUnlocks` uit `'./progress'`):

```ts
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
```

Voeg toe aan `src/state/reducer.test.ts`:

```ts
  it('setup can start a save for another child', () => {
    const s = reducer(initialState(null), { type: 'setup', elfName: 'Fleur', profileId: 'lucy' });
    expect(s.save!.profileId).toBe('lucy');
    expect(s.save!.unlocked).toEqual([0, 1]);
  });
```

- [ ] **Step 2: Draai de tests, ze moeten falen**

Run: `npx vitest run src/data/profiles.test.ts src/logic/storage.test.ts src/state/reducer.test.ts`
Expected: FAIL (module/velden ontbreken).

- [ ] **Step 3: Maak `src/data/profiles.ts`**

```ts
/**
 * De kinderen die de app gebruiken. Elk kind heeft een eigen apparaat en een eigen account (e-mailadres);
 * dat adres bepaalt het profiel. Een nieuw kind toevoegen = hier een profiel bijzetten.
 */
export type ProfileId = 'floor' | 'lucy';

/** Hoeveel nieuwe sommen er per ronde en per dag mogen bijkomen (perDay null = geen daglimiet). */
export interface IslandLimits {
  perRound: number;
  perDay: number | null;
}

export interface ChildProfile {
  id: ProfileId;
  email: string;
  /** Zoals het in tekst staat. */
  name: string;
  /** Zoals het hardop gezegd wordt (ElevenLabs en de stem van het apparaat). */
  spokenName: string;
  /** Submap van public/audio met de zinnen die de naam bevatten; null = de gedeelde opnames. */
  audioDir: string | null;
  /** Eilanden die bij het aanmaken van de save al volledig gekend zijn. */
  knownIslands: number[];
  /** Afwijkingen van de standaardlimieten (zie `defaultLimits` in logic/round.ts), per eiland. */
  newFacts: Partial<Record<number, IslandLimits>>;
}

export const FLOOR: ChildProfile = {
  id: 'floor',
  email: 'yoridewit@pm.me',
  name: 'Floor',
  spokenName: 'Floor',
  audioDir: null,
  knownIslands: [],
  newFacts: {},
};

export const LUCY: ChildProfile = {
  id: 'lucy',
  email: 'lucy@tafels.nl',
  name: 'Lucy',
  spokenName: 'Lusie',
  audioDir: 'lucy',
  knownIslands: [0],
  newFacts: { 1: { perRound: 2, perDay: 5 } },
};

export const PROFILES: ChildProfile[] = [FLOOR, LUCY];

export function profileById(id: unknown): ChildProfile {
  return PROFILES.find((p) => p.id === id) ?? FLOOR;
}

export function profileForEmail(email: string): ChildProfile | null {
  const e = email.trim().toLowerCase();
  return PROFILES.find((p) => p.email === e) ?? null;
}

let active: ChildProfile = FLOOR;

/** Het kind dat nu speelt; tekst (`phraseText`) en audio lezen dit. Idempotent. */
export function setActiveProfile(p: ChildProfile) {
  active = p;
}

export function activeProfile(): ChildProfile {
  return active;
}
```

- [ ] **Step 4: Pas `storage.ts` aan**

Voeg imports toe: `import { FLOOR, profileById, type ChildProfile, type ProfileId } from '../data/profiles';`, `import { addDays, dayKey } from './dates';`, `import { factsForIsland } from './facts';` (de bestaande import van `ALL_FACTS` uit `./facts` samenvoegen), `import { newFactState } from './leitner';` (bij de bestaande type-import van leitner: `import { newFactState, type FactState } from './leitner';`).

In `SaveData` na `elfName`: `profileId: ProfileId;`

Vervang `emptySave` door:

```ts
/** Sommen van de opgegeven eilanden die bij de start al gekend zijn (hoogste doos, twee snelle dagen). */
function knownFacts(islands: number[], today: string): Record<FactKey, FactState> {
  const facts: Record<FactKey, FactState> = {};
  for (const i of islands)
    for (const k of factsForIsland(i))
      facts[k] = {
        ...newFactState(),
        box: 5,
        due: addDays(today, 7),
        fastDays: [addDays(today, -1), today],
        seen: 3,
      };
  return facts;
}

export function emptySave(elfName = '', profile: ChildProfile = FLOOR): SaveData {
  const now = new Date().toISOString();
  const known = profile.knownIslands;
  return {
    version: 1,
    elfName,
    profileId: profile.id,
    facts: knownFacts(known, dayKey()),
    stars: 0,
    owned: [],
    wearing: {},
    stickers: [],
    practiceDays: [],
    roundsByDay: {},
    timeByDay: {},
    roundsDone: 0,
    // Gekende eilanden zijn open, plus het eiland erna.
    discovered: [...known],
    unlocked: [...new Set([0, ...known, ...known.map((i) => i + 1)])].sort((a, b) => a - b),
    speedRecord: 0,
    settings: { sound: true, speech: true, music: true, musicVolume: 1, voice: null, dailyLimitMinutes: 10 },
    createdAt: now,
    updatedAt: now,
  };
}
```

In `parseSave`: voeg in het teruggegeven object na `elfName` toe: `profileId: profileById(raw.profileId).id,`. (`base = emptySave()` blijft ongewijzigd.)

- [ ] **Step 5: Pas de reducer aan**

`src/state/reducer.ts`: importeer `import { profileById, type ProfileId } from '../data/profiles';`. Wijzig het type: `| { type: 'setup'; elfName: string; profileId?: ProfileId }` en de regel in `reducer`:

```ts
  if (action.type === 'setup') return initialState(emptySave(action.elfName, profileById(action.profileId)));
```

- [ ] **Step 6: Draai alle tests en de typecheck**

Run: `npx tsc --noEmit -p . && npx vitest run`
Expected: PASS. Los falende bestaande tests op die letterlijk een volledige `SaveData` verwachten door `profileId` toe te voegen.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "Add child profiles with a per-child starting save

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Limieten voor nieuwe sommen per profiel

**Files:**
- Modify: `src/logic/round.ts`
- Modify: `src/logic/round.test.ts`
- Modify: `src/screens/RoundScreen.tsx:23`
- Modify: `src/data/profiles.ts` (hulpfunctie `limitsFor`)
- Modify: `src/data/profiles.test.ts`

**Interfaces:**
- Consumes: `IslandLimits`, `ChildProfile` uit Task 3.
- Produces: `defaultLimits(island: number): IslandLimits` (in `round.ts`; eiland 0/1 → `{3, null}`, vanaf 2 → `{1, 2}`);
  `RoundOptions.limits?: IslandLimits`; `limitsFor(profile: ChildProfile, island: number): IslandLimits` (in `profiles.ts`).

> Let op: `profiles.ts` importeert `defaultLimits` uit `round.ts`; `round.ts` importeert niets uit `profiles.ts`. Zo ontstaat geen importcyclus.

- [ ] **Step 1: Schrijf de falende tests**

In `src/logic/round.test.ts` (importeer `defaultLimits` uit `./round`): voeg toe

```ts
  it('default limits: 3 per round for the first two islands, then 1 per round and 2 per day', () => {
    expect(defaultLimits(0)).toEqual({ perRound: 3, perDay: null });
    expect(defaultLimits(1)).toEqual({ perRound: 3, perDay: null });
    expect(defaultLimits(2)).toEqual({ perRound: 1, perDay: 2 });
    expect(defaultLimits(8)).toEqual({ perRound: 1, perDay: 2 });
  });

  it('custom limits apply: 2 per round and 5 per day on the table of 2', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(0)) facts[k] = st(5, '2026-10-01');
    const opts = { island: 1, unlocked: [0, 1], today: T, rng: seq(), limits: { perRound: 2, perDay: 5 } };
    const newKeys = (f: Record<string, FactState>) =>
      new Set(buildRound({ ...opts, facts: f }).filter((q) => q.isNew).map((q) => q.key)).size;
    expect(newKeys(facts)).toBe(2);

    const day = { ...facts };
    for (const k of ['2-2', '2-3', '2-4'] as const) day[k] = { ...st(3, '2026-10-01'), introduced: T };
    expect(newKeys(day)).toBe(2);
    day['2-5'] = { ...st(3, '2026-10-01'), introduced: T };
    expect(newKeys(day)).toBe(1);
    day['2-6'] = { ...st(3, '2026-10-01'), introduced: T };
    expect(newKeys(day)).toBe(0);
  });

  it('without a daily limit only the per-round limit applies', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(0)) facts[k] = st(5, '2026-10-01');
    facts['2-2'] = { ...st(3, '2026-10-01'), introduced: T };
    facts['2-3'] = { ...st(3, '2026-10-01'), introduced: T };
    facts['2-4'] = { ...st(3, '2026-10-01'), introduced: T };
    const qs = buildRound({ island: 1, facts, unlocked: [0, 1], today: T, rng: seq(), limits: { perRound: 3, perDay: null } });
    expect(new Set(qs.filter((q) => q.isNew).map((q) => q.key)).size).toBe(3);
  });
```

Voeg toe aan `src/data/profiles.test.ts` (importeer `limitsFor`, `LUCY`):

```ts
  it('limitsFor uses the profile override or the default', () => {
    expect(limitsFor(LUCY, 1)).toEqual({ perRound: 2, perDay: 5 });
    expect(limitsFor(LUCY, 2)).toEqual({ perRound: 1, perDay: 2 });
    expect(limitsFor(FLOOR, 1)).toEqual({ perRound: 3, perDay: null });
    expect(limitsFor(FLOOR, 3)).toEqual({ perRound: 1, perDay: 2 });
  });
```

- [ ] **Step 2: Draai de tests, ze moeten falen**

Run: `npx vitest run src/logic/round.test.ts src/data/profiles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementeer in `round.ts`**

Verwijder de constanten `HARD_FROM_ISLAND`, `NEW_PER_ROUND`, `NEW_PER_DAY`. Voeg toe (boven `learningCapForIsland`):

```ts
/** Hoeveel nieuwe sommen er per ronde en per dag bij mogen komen (perDay null = geen daglimiet). */
export interface IslandLimits {
  perRound: number;
  perDay: number | null;
}

/** Eiland 0 en 1 zijn makkelijk (3 per ronde); vanaf de tafel van 5 zijn nieuwe sommen lastiger: 1 per ronde, 2 per dag. */
export function defaultLimits(island: number): IslandLimits {
  return island >= 2 ? { perRound: 1, perDay: 2 } : { perRound: 3, perDay: null };
}
```

Voeg aan `RoundOptions` toe: `limits?: IslandLimits;`. Wijzig de signatuur: `buildRound({ island, facts, unlocked, today, rng = Math.random, size = 10, limits = defaultLimits(island) }: RoundOptions)`. Vervang het blok vanaf `const perRound = …` tot en met de `if (island >= HARD_FROM_ISLAND) { … }` door:

```ts
  // De allereerste ronde (nog niets geoefend) mag er 4 hebben; daarna geldt de limiet per ronde.
  const perRound = practicedAny ? limits.perRound : Math.max(limits.perRound, 4);
  let maxNew = Math.min(learning >= cap ? 0 : learning >= cap - 2 ? 1 : perRound, perRound);
  if (limits.perDay !== null) {
    const introducedToday = Object.values(facts).filter((s) => s.introduced === today).length;
    maxNew = Math.min(maxNew, Math.max(0, limits.perDay - introducedToday));
  }
```

Verplaats de nu dubbele definitie van `IslandLimits` uit `profiles.ts`: in `profiles.ts` verwijder de eigen `interface IslandLimits` en schrijf bovenaan `import { defaultLimits, type IslandLimits } from '../logic/round';` en `export type { IslandLimits };`. Voeg onderaan toe:

```ts
export function limitsFor(profile: ChildProfile, island: number): IslandLimits {
  return profile.newFacts[island] ?? defaultLimits(island);
}
```

- [ ] **Step 4: Geef de limieten door in `RoundScreen.tsx`**

Regel 23 wordt:

```tsx
    buildRound({ island, facts: save.facts, unlocked: save.unlocked, today, limits: limitsFor(profileById(save.profileId), island) }),
```

met `import { limitsFor, profileById } from '../data/profiles';`.

- [ ] **Step 5: Draai alles**

Run: `npx tsc --noEmit -p . && npx vitest run`
Expected: PASS (de bestaande tests voor Floor-limieten uit de vorige taak blijven groen, omdat de defaults gelijk zijn).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "Take the limits on new sums from the child profile

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: De naam van het kind in tekst en audio

**Files:**
- Modify: `src/data/phrases.ts` (`{naam}` in zinnen, `phraseText`, `spokenText`)
- Modify: `src/data/phrases.test.ts`
- Create: `src/logic/recordings.ts`, `src/logic/recordings.test.ts`
- Modify: `src/data/audio-manifest.json` (nieuw veld `children`)
- Modify: `src/audio.ts`
- Modify: `src/state/store.tsx` (actief profiel instellen)
- Modify: `scripts/generate-audio.ts` (`--child=<id>`)
- Modify: `README.md` (audio-sectie)
- Modify: `src/screens/Welcome.tsx` (alleen `CHILD_NAME` → profielnaam; de inlogstap volgt in Task 6)

**Interfaces:**
- Consumes: `activeProfile`, `ChildProfile`, `profileById` uit Task 3.
- Produces:
  - `phraseText(id: string): string` — vult `{naam}` met `activeProfile().name`.
  - `spokenText(id: string, profile?: ChildProfile): string` — vult `{naam}` met `profile.spokenName` (standaard het actieve profiel).
  - `PHRASES: Record<string, string>` blijft de ruwe sjablonen (met `{naam}`) bevatten.
  - `nameLineIds(): string[]` — ids van zinnen die `{naam}` bevatten.
  - `recordingFile(id: string, profile: ChildProfile, manifest: AudioManifest): string | null` (in `recordings.ts`);
    `AudioManifest = { voice: string | null; ids: string[]; children?: Record<string, string[]> }`.

- [ ] **Step 1: Schrijf de falende tests**

In `src/data/phrases.test.ts` vervang de test `greets Floor by name` door:

```ts
  it('greets the active child by name', () => {
    expect(phraseText('home-0')).toBe('Hoi Floor! Zullen we samen oefenen?');
    expect(phraseText('welkom-1')).toMatch(/^Hoi Floor!/);
    setActiveProfile(profileById('lucy'));
    expect(phraseText('home-0')).toBe('Hoi Lucy! Zullen we samen oefenen?');
    expect(spokenText('home-0')).toBe('Hoi Lusie! Zullen we samen oefenen?');
    expect(spokenText('home-0', FLOOR)).toBe('Hoi Floor! Zullen we samen oefenen?');
    setActiveProfile(FLOOR);
    expect(Object.keys(PHRASES).some((id) => id.endsWith('.n'))).toBe(false);
  });

  it('exactly six lines contain the child’s name', () => {
    expect(nameLineIds().sort()).toEqual(['home-0', 'home-1', 'res-goed', 'res-knap', 'res-top', 'welkom-1']);
  });
```

(importeer `FLOOR, profileById, setActiveProfile` uit `./profiles` en `nameLineIds, spokenText` uit `./phrases`.)

`src/logic/recordings.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { recordingFile, type AudioManifest } from './recordings';
import { FLOOR, LUCY } from '../data/profiles';

const manifest: AudioManifest = {
  voice: 'v',
  ids: ['bijna', 'home-0', 'd-2-3'],
  children: { lucy: ['home-0'] },
};

describe('recordingFile', () => {
  it('uses the shared recording for lines without a name', () => {
    expect(recordingFile('bijna', FLOOR, manifest)).toBe('bijna');
    expect(recordingFile('bijna', LUCY, manifest)).toBe('bijna');
  });

  it('uses the shared recording of a name line for Floor', () => {
    expect(recordingFile('home-0', FLOOR, manifest)).toBe('home-0');
  });

  it('uses the child’s own recording of a name line when it exists', () => {
    expect(recordingFile('home-0', LUCY, manifest)).toBe('lucy/home-0');
  });

  it('has no recording of a name line for a child that has none yet (device voice speaks it)', () => {
    expect(recordingFile('home-1', LUCY, manifest)).toBeNull();
    expect(recordingFile('home-0', LUCY, { voice: null, ids: ['home-0'] })).toBeNull();
  });

  it('has no recording for unknown ids', () => {
    expect(recordingFile('nope', FLOOR, manifest)).toBeNull();
  });
});
```

- [ ] **Step 2: Draai de tests, ze moeten falen**

Run: `npx vitest run src/data/phrases.test.ts src/logic/recordings.test.ts`
Expected: FAIL.

- [ ] **Step 3: `phrases.ts`**

Verwijder `export const CHILD_NAME = 'Floor';` (en het commentaar erboven); importeer `import { activeProfile, type ChildProfile } from './profiles';`. Vervang in de zes zinnen `${CHILD_NAME}` door `{naam}` (gewone aanhalingstekens/backticks mogen blijven, bijv. `` `Hoi {naam}! Ik ben een elfje …` `` wordt gewone string `'Hoi {naam}! …'`). Vervang onderaan `phraseText` door:

```ts
const NAME = '{naam}';

const fill = (text: string, name: string) => text.split(NAME).join(name);

/** Tekst van een zin, met de naam van het kind dat nu speelt. */
export function phraseText(id: string): string {
  return fill(LINES[id] ?? '', activeProfile().name);
}

/** Wat hardop gezegd wordt: de naam in zijn uitspraak ("Lusie"). */
export function spokenText(id: string, profile: ChildProfile = activeProfile()): string {
  return fill(LINES[id] ?? '', profile.spokenName);
}

/** Ids van zinnen waarin de naam van het kind voorkomt (die per kind opnieuw opgenomen worden). */
export function nameLineIds(): string[] {
  return Object.keys(LINES).filter((id) => LINES[id].includes(NAME));
}
```

`PHRASES` blijft `{ ...LINES }` (sjablonen). In `src/screens/Welcome.tsx`: verwijder de import van `CHILD_NAME`, importeer `activeProfile` uit `'../data/profiles'` en gebruik in de `<h1>`: `Hoi {activeProfile().name}!`. (De profielkeuze komt in Task 6.)

- [ ] **Step 4: `recordings.ts`**

```ts
import type { ChildProfile } from '../data/profiles';
import { nameLineIds } from '../data/phrases';

export interface AudioManifest {
  voice: string | null;
  /** Gedeelde opnames in public/audio/. */
  ids: string[];
  /** Per kind (profiel-id) de opnames van zinnen met de naam, in public/audio/<audioDir>/. */
  children?: Record<string, string[]>;
}

/**
 * Welk geluidsbestand (zonder .mp3) bij deze zin hoort, of null als er geen opname is
 * (dan leest de stem van het apparaat de zin voor).
 */
export function recordingFile(id: string, profile: ChildProfile, manifest: AudioManifest): string | null {
  if (profile.audioDir && nameLineIds().includes(id))
    return manifest.children?.[profile.id]?.includes(id) ? `${profile.audioDir}/${id}` : null;
  return manifest.ids.includes(id) ? id : null;
}
```

- [ ] **Step 5: `audio.ts` en manifest**

`src/data/audio-manifest.json`: voeg na `"voice"` toe `"children": {},` (bestaande `ids` ongewijzigd).

In `src/audio.ts`:
- importeer `import { activeProfile } from './data/profiles';`, `import { recordingFile, type AudioManifest } from './logic/recordings';` en wijzig `import { factId, hintId, phraseText, praiseId, questionId } from './data/phrases';` naar `… praiseId, questionId, spokenText } from …`.
- Vervang `const manifest = manifestJson as { voice: string | null; ids: string[] }; const recorded = new Set<string>(manifest.ids);` door `const manifest = manifestJson as AudioManifest; const recorded = new Set<string>(manifest.ids);`
- `hasRecordedVoice` blijft.
- Vervang `recordingFor` door:

```ts
function recordingFor(id: string): string | null {
  return recordingFile(id, activeProfile(), manifest);
}
```

- In `playOne` de fallback `await speakAndWait(phraseText(id))` → `await speakAndWait(spokenText(id))`. Verwijder `phraseText` uit de import als hij daarna ongebruikt is.

- [ ] **Step 6: Actief profiel instellen in `store.tsx`**

Importeer `import { profileById, setActiveProfile } from '../data/profiles';` en zet bij de andere setters tijdens het renderen:

```ts
  // Tekst en audio lezen het actieve profiel; zonder save blijft staan wat het welkomstscherm koos.
  if (state.save) setActiveProfile(profileById(state.save.profileId));
```

- [ ] **Step 7: Audiogenerator `--child=<id>`**

In `scripts/generate-audio.ts`:
- Importeer `import { PHRASES, nameLineIds, spokenText } from '../src/data/phrases';` en `import { FLOOR, PROFILES } from '../src/data/profiles';`
- Voeg toe na `const takes = …`:

```ts
const childArg = arg('child');
const child = childArg ? PROFILES.find((p) => p.id === childArg) : undefined;
if (childArg && !child) throw new Error(`Onbekend kind: ${childArg}. Kies uit ${PROFILES.map((p) => p.id).join(', ')}`);
```

- Pas de tekst die naar ElevenLabs gaat aan: overal waar nu `PHRASES[id]` of `text` uit `Object.entries(PHRASES)` gebruikt wordt, gebruik `spokenText(id, child ?? FLOOR)`. Concreet: `const text = arg('text') ?? PHRASES[id];` wordt `arg('text') ?? spokenText(id, child ?? FLOOR)`, en de `todo`-lijst wordt gebouwd uit `ids` waarbij `ids = child ? nameLineIds() : Object.keys(PHRASES)`:

```ts
  const outDir = child?.audioDir ? join(OUT_DIR, child.audioDir) : OUT_DIR;
  mkdirSync(outDir, { recursive: true });
  const ids = child ? nameLineIds() : Object.keys(PHRASES);
  const todo = ids
    .map((id): [string, string] => [id, spokenText(id, child ?? FLOOR)])
    .filter(
      ([id]) =>
        (only ? only.includes(id) : child || !HANDPICKED.has(id)) && (force || !existsSync(join(outDir, `${id}.mp3`))),
    );
```

  en schrijf naar `join(outDir, `${id}.mp3`)`.
- `writeManifest()` bewaart de gedeelde `ids` zoals nu, en voegt per kind de aanwezige naamzinnen toe:

```ts
function writeManifest() {
  const ids = readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.slice(0, -4))
    .filter((id) => id in PHRASES)
    .sort();
  const children: Record<string, string[]> = {};
  for (const p of PROFILES) {
    if (!p.audioDir) continue;
    const dir = join(OUT_DIR, p.audioDir);
    if (!existsSync(dir)) continue;
    children[p.id] = readdirSync(dir)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => f.slice(0, -4))
      .filter((id) => nameLineIds().includes(id))
      .sort();
  }
  writeFileSync(MANIFEST, JSON.stringify({ voice: voiceId, ids, children }, null, 2) + '\n');
  return ids.length;
}
```

- Werk het usage-commentaar bovenin bij met: `npm run audio -- --child=lucy   # alleen de zinnen met de naam van dat kind, in public/audio/lucy/`.

`README.md`: voeg na stap 5 in de audio-sectie toe: "Een kind met een andere naam (zoals Lucy, uitgesproken als "Lusie")? Draai `npm run audio -- --child=lucy`; dat spreekt alleen de zes zinnen met de naam in en zet ze in `public/audio/lucy/`. Commit ook die map en `src/data/audio-manifest.json`."

- [ ] **Step 8: Draai alles**

Run: `npx tsc --noEmit -p . && npx vitest run`
Expected: PASS. (De generator draai je hier niet: die heeft een API-sleutel nodig. Controleer wel dat `npx tsc --noEmit -p .` ook `scripts/` aankan; zo niet, draai `npx tsx scripts/generate-audio.ts --voices` niet, maar controleer de typen via de bestaande tsconfig-opzet.)

- [ ] **Step 9: Commit**

```bash
git add src scripts README.md
git commit -m "Use the child's own name in text and recorded audio

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Inlogscherm en welkom per kind

**Files:**
- Modify: `src/components/CloudLogin.tsx` (prop `validate`, e-mail komt mee in `onDone`)
- Modify: `src/screens/Welcome.tsx`
- Modify: `src/styles.css` (indien nodig voor de inlogkaart)

**Interfaces:**
- Consumes: `profileForEmail`, `setActiveProfile`, `FLOOR`, `activeProfile`, `ChildProfile` (Task 3); reducer-actie `setup` met `profileId` (Task 3); `StartOutcome` uit `cloud/sync`.
- Produces: `CloudLogin` props `{ onDone?: (outcome: StartOutcome, email: string) => void; validate?: (email: string) => string | null; emailPlaceholder?: string }`.

- [ ] **Step 1: `CloudLogin` uitbreiden**

In `src/components/CloudLogin.tsx` de signatuur en `submit` aanpassen:

```tsx
export function CloudLogin({
  onDone,
  validate,
  emailPlaceholder = 'E-mailadres van de ouder',
}: {
  onDone?: (outcome: StartOutcome, email: string) => void;
  /** Geeft een foutmelding terug als dit adres niet mag inloggen; null = goed. Er wordt dan niet ingelogd. */
  validate?: (email: string) => string | null;
  emailPlaceholder?: string;
}) {
```

en in `submit`, vóór `setBusy(true)`:

```tsx
    const invalid = validate?.(email.trim());
    if (invalid) {
      setError(invalid);
      return;
    }
```

`onDone?.(outcome, email.trim());` en `placeholder={emailPlaceholder}`. De bestaande aanroepen (`CloudPanel`, oude `Welcome`-herstelmodus) blijven werken doordat alle nieuwe props optioneel zijn.

- [ ] **Step 2: `Welcome.tsx` herschrijven**

Vervang de inhoud van `src/screens/Welcome.tsx` door (de rest van het bestand — de chips-lijst, invoerveld en knop — blijft gelijk aan de bestaande JSX; hieronder volledig uitgeschreven):

```tsx
import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
import { useStore } from '../state/store';
import { say, sound } from '../audio';
import { phraseText } from '../data/phrases';
import { CloudLogin } from '../components/CloudLogin';
import { useCloud } from '../cloud/CloudProvider';
import { FLOOR, activeProfile, profileForEmail, setActiveProfile, type ChildProfile } from '../data/profiles';

const ELF_NAMES = ['Pip', 'Fleur', 'Lila', 'Sprankel', 'Juul', 'Tinka'];

/** Eerste scherm op een apparaat zonder save: inloggen (of zonder account beginnen) en dan het elfje een naam geven. */
export function Welcome() {
  const { dispatch } = useStore();
  const cloud = useCloud();
  const [elf, setElf] = useState('');
  const [mode, setMode] = useState<'login' | 'setup'>(cloud.configured ? 'login' : 'setup');
  const [profile, setProfile] = useState<ChildProfile>(activeProfile());

  // Het elfje praat pas zodra duidelijk is bij welk kind hij hoort.
  useEffect(() => {
    if (mode === 'setup') say('welkom-1');
  }, [mode]);

  const choose = (p: ChildProfile) => {
    setActiveProfile(p);
    setProfile(p);
    setMode('setup');
  };

  if (mode === 'login') {
    return (
      <div className="screen welcome">
        <div className="elf-stage">
          <Elf size={160} mood="juichen" className="float" />
        </div>
        <div className="card welcome-card">
          <h1>Welkom!</h1>
          <p className="big">Log in om verder te spelen.</p>
          <CloudLogin
            emailPlaceholder="E-mailadres"
            validate={(email) => (profileForEmail(email) ? null : 'Dit account hoort bij geen kind.')}
            onDone={(outcome, email) => {
              // Bestaat er al voortgang, dan zet de sync die terug en verdwijnt dit scherm vanzelf.
              if (outcome === 'none') {
                const p = profileForEmail(email);
                if (p) choose(p);
              }
            }}
          />
          <button className="btn btn-white btn-small" onClick={() => choose(FLOOR)}>
            Zonder account beginnen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen welcome">
      <div className="elf-stage">
        <Elf size={160} mood="juichen" className="float" />
      </div>
      <div className="card welcome-card">
        <h1>Hoi {profile.name}!</h1>
        <p className="big">{phraseText('welkom-1').replace(/^Hoi [^!]*! /, '')}</p>
        <div className="chips">
          {ELF_NAMES.map((n) => (
            <button key={n} className={`chip ${elf === n ? 'chip-on' : ''}`} onClick={() => setElf(n)}>
              {n}
            </button>
          ))}
        </div>
        <input
          className="text-input"
          value={elf}
          onChange={(e) => setElf(e.target.value)}
          placeholder="Of verzin er zelf een"
          maxLength={20}
        />
        <button
          className="btn btn-primary btn-big"
          disabled={!elf.trim()}
          onClick={() => {
            sound.fanfare();
            dispatch({ type: 'setup', elfName: elf.trim(), profileId: profile.id });
          }}
        >
          <Icon name="sparkle" />
          Dat is ze!
        </button>
      </div>
    </div>
  );
}
```

> Let op bij het schrijven: neem de knoptekst, het icoon en de overige classes van de **bestaande** `Welcome.tsx` over (lees het bestand eerst). De paragraaf `<p className="big">` toonde eerder de volledige tekst "Ik ben een elfje, en samen gaan we de tafels leren. Maar eerst: …"; de begroeting "Hoi {naam}!" staat al in de `<h1>`, daarom strip je die uit de zin met de regex hierboven. Controleer dat de weergegeven tekst na de `<h1>` nog steeds "Ik ben een elfje, en samen gaan we de tafels leren. Maar eerst: ik heb nog geen naam. Wil jij er een voor mij kiezen?" is. Verwijder de oude `gate`- en `restore`-modi en de imports van `MathGate`/`TopBar` uit dit bestand (de bestanden zelf blijven bestaan; `MathGate` wordt elders gebruikt: controleer met `grep -rn MathGate src`).

- [ ] **Step 3: Typecheck en alle tests**

Run: `npx tsc --noEmit -p . && npx vitest run`
Expected: PASS.

- [ ] **Step 4: Controleer in de browser** (`preview_start` met `tafels`, wis eerst localStorage of gebruik een privévenster)

Controleer:
1. Een leeg apparaat toont "Welkom! Log in …" met "Zonder account beginnen".
2. Een onbekend adres (`iemand@anders.nl` + willekeurig wachtwoord) geeft "Dit account hoort bij geen kind." en logt niet in (geen netwerkverzoek naar Firebase Auth in `read_network_requests`).
3. "Zonder account beginnen" geeft het bekende scherm "Hoi Floor!"; na het kiezen van een naam start de kaart met timer linksboven en tafel 1&10 als eerste eiland.
4. Lucy zonder wachtwoord testen: roep in de console `localStorage.clear()` en simuleer de keuze door tijdelijk in de dev-console het profiel te controleren: `import('/src/data/profiles.ts').then(m => m.profileForEmail('lucy@tafels.nl'))` moet het Lucy-profiel geven. Een echte login met Lucy's wachtwoord test de gebruiker zelf.
5. Na het kiezen van een naam met profiel Lucy (met `dispatch` via de UI niet te bereiken zonder login): controleer in plaats daarvan de startstand via de unit-test uit Task 3.

Meld in de eindrapportage dat de echte Lucy-login niet is geprobeerd (geen wachtwoord), en wat wel is gecontroleerd.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "Add a login step to the welcome screen and greet each child by name

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage**
- §1 Profielen (e-mail → kind, geweigerd bij onbekend, `profileId`, oude saves = Floor): Task 3 + validatie in Task 6.
- §2 Inlogscherm en startstand (inlogscherm, "Zonder account beginnen", welkomstscherm met profielnaam, Lucy's startstand, blijft ingelogd): Task 6 + Task 3. "Blijft ingelogd" is bestaand Firebase-gedrag.
- §3 Regels voor nieuwe sommen (tabel): Task 4 (defaults + Lucy-override uit Task 3).
- §4 Naam in tekst en audio (`CHILD_NAME` weg, zes zinnen, `--child`, manifest, fallback): Task 5.
- §5 Timer en standaardlimiet: Task 2. **Afwijking van de spec:** de spec noemt `m:ss`; het plan toont hele minuten (`7 min`), omdat de speeltijd maar elke 20 seconden bijgewerkt wordt (`TICK_MS`) en een seconde-teller dan zou springen. Werk de specregel bij als deze keuze blijft.
- §6 Sterren (geen "+1", totaal en opbouw op eindscherm, bonus 6, kwartregel blijft met uitleg): Task 1.
- Testen: unit-tests in elke taak; browsercontrole in Task 2 en 6.

**Placeholder scan:** geen "TBD"; Task 6 stap 2 verwijst naar het bestaande bestand voor de exacte knop-JSX, met expliciete instructie wat over te nemen.

**Type consistency:** `IslandLimits` leeft in `logic/round.ts` en wordt door `profiles.ts` opnieuw geëxporteerd (Task 4); `ChildProfile.newFacts: Partial<Record<number, IslandLimits>>`; `limitsFor(profile, island)` wordt gebruikt in `RoundScreen`; `recordingFile(id, profile, manifest)`, `AudioManifest`, `spokenText(id, profile?)`, `nameLineIds()` zijn in Task 5 overal met dezelfde namen gebruikt; `roundBreakdown` en `RoundBreakdown` in Task 1; `remainingMinutes(save, today)` in Task 2.
