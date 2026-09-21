# Tafels-elfje Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tablet-PWA waarmee een kind van 8 de tafels 1–10 leert met strategieën, spaced repetition en een aan te kleden elfje.

**Architecture:** Pure TypeScript-leerlogica in `src/logic/` (unit-getest) + een pure reducer in `src/state/` die de opgeslagen `SaveData` muteert; React-schermen in `src/screens/` lezen state via context. Opslag in localStorage, geen server.

**Tech Stack:** Vite 6, React 18, TypeScript, vite-plugin-pwa, Vitest, @fontsource/baloo-2.

**Spec:** `docs/superpowers/specs/2026-09-21-tafels-elfje-design.md`

## Global Constraints

- Alle UI-tekst in het Nederlands, kindvriendelijk, geen rood-kruis-straf.
- Touch-targets ≥ 64px; tablet portrait én landscape; geen horizontale scroll.
- Geen netwerkcalls; alles werkt offline na eerste load.
- localStorage-key: `tafels-elfje-v1`; `version: 1`.
- Snel = antwoord ≤ 4000 ms. Leitner-intervallen (dagen) box1:0, box2:1, box3:2, box4:4, box5:7.
- Gekend = box ≥ 4 én ≥ 2 verschillende dagen snel goed.
- Eilandvolgorde: [1,10], [2], [5], [3], [4], [6], [7], [8], [9].

---

## File structure

| File | Responsibility |
|---|---|
| `src/logic/dates.ts` | `dayKey(date)`, `addDays(key,n)`, `daysBetween(a,b)` |
| `src/logic/facts.ts` | `FactKey`, `factKey`, `parseFactKey`, `ALL_FACTS`, `ISLANDS`, `factsForIsland`, `introOrderForIsland`, `orientFact` |
| `src/logic/leitner.ts` | `FactState`, `applyAnswer`, `isKnown`, `factStatus`, `isDue`, `FAST_MS` |
| `src/logic/hints.ts` | `hintFor(a,b): Hint` strategie-hints |
| `src/logic/round.ts` | `buildRound(opts): Question[]` |
| `src/logic/progress.ts` | `islandProgress`, `unlockedIslands`, `knownCount` |
| `src/logic/streak.ts` | `currentStreak(days,today)` |
| `src/logic/storage.ts` | `SaveData`, `emptySave`, `parseSave`, `loadSave`, `writeSave` |
| `src/data/shop.ts` | item-catalogus (slot, prijs, eiland-eis) |
| `src/data/stickers.ts` | sticker-definities + `earnedStickers(snapshot)` |
| `src/state/reducer.ts` | pure reducer over `AppState` |
| `src/state/store.tsx` | React context + persistentie |
| `src/audio.ts` | Web Audio-geluidjes en `speak()` |
| `src/components/*` | `Elf`, `ElfItems`, `NumPad`, `Groups`, `NumberLine`, `TopBar`, `Modal` |
| `src/screens/*` | `Welcome`, `MapScreen`, `IslandScreen`, `Discover`, `RoundScreen`, `RoundResult`, `Shop`, `Album`, `SpeedGame`, `ParentGate`, `Parent` |

## Tasks

### Task 1: Scaffold
Vite React-TS project, vitest, vite-plugin-pwa (manifest `Tafels met het elfje`, `display: standalone`, `theme_color #8b5cf6`), fontsource, PWA-iconen via `@vite-pwa/assets-generator` uit `public/logo.svg`. Verify: `npm run build` slaagt. Commit.

### Task 2: dates + facts (TDD)
Tests: `ALL_FACTS.length === 55`; `factKey(7,3) === factKey(3,7) === "3-7"`; `factsForIsland(0).length === 19`; `factsForIsland(1)` (tafel 2) bevat 10 feiten incl. `"1-2"`, `"2-10"`; `introOrderForIsland(1)` begint met `1-2, 2-2, 2-10, 2-5`; `orientFact("3-7", [7])` → `{a:3,b:7}`; `addDays("2026-09-30",1) === "2026-10-01"`; `daysBetween("2026-09-21","2026-09-24") === 3`.

### Task 3: leitner (TDD)
Tests: nieuw + snel goed → box 2, due morgen, fastDays [today]; traag goed vanaf box 0 → box 1, due vandaag; fout vanaf box 4 → box 1; box max 5; `isKnown` false bij box 5 met 1 fastDay, true bij 2 dagen; `factStatus(undefined) === "nieuw"`; `isDue`.

### Task 4: hints (TDD)
`hintFor(a,b)` met a = vermenigvuldiger, b = tafel. Draait om als de andere kant makkelijker is (rang 1,10,2,5,4,9,6,3,8,7). Tests: `hintFor(6,7).steps` bevat `"5 × 7 = 35"` en `"35 + 7 = 42"`; `hintFor(9,4)` gebruikt `10 × 4 = 40` en `40 − 4 = 36`; `hintFor(7,2).flipped === true` met `2 × 7`; `hintFor(8,3)` bevat `4 × 3 = 12`.

### Task 5: round + progress + streak (TDD)
`buildRound`: eerste ronde eiland 0 → 4 nieuwe feiten die elk 2× voorkomen, 2e keer ≥ 2 plekken later, geen twee gelijke direct na elkaar; met veel geoefende feiten → lengte 10, max 3 nieuw; ≥ 6 feiten in box 1–2 → 0 nieuw. `islandProgress` mastered-regel (alles ≥ bijna, ≥ 80% gekend). `unlockedIslands` inclusief handmatige vrijgave. `currentStreak`: gat van 1 dag breekt niet, gat van 2 dagen wel.

### Task 6: storage + stickers + shop + reducer (TDD)
`parseSave` vult defaults, weigert andere versie, filtert kapotte fact-states. Reducer: `answer`, `finishRound` (sterren 1/goed + 3 + 5 eerste ronde van de dag, oefendag, stickers), `buy` (genoeg sterren, eiland-eis), `wear/unwear`, `speedDone`, `settings`, `toggleUnlock`, `import`, `reset`.

### Task 7: Elf + items + basiscomponenten
SVG-elfje (viewBox 0 0 200 260) met lagen achtergrond → huisdier → vleugels → lijf → sjaal → hoed → staf; `mood` blij/juichen. NumPad (0–9, wissen, OK). Groups (n stippen per groepje, rijtjes van 5). NumberLine met sprongen.

### Task 8: Schermen kind
Welcome, MapScreen, IslandScreen, Discover, RoundScreen (intro-kaart bij nieuw feit, hint + natypen bij fout, fout feit komt 3 plekken later terug), RoundResult, Shop/kast, Album, SpeedGame. Audio.

### Task 9: Ouderdeel
ParentGate (a×b met 12–19), Parent: 10×10-raster, 8-wekenkalender, eilanden vrijgeven, instellingen, back-up export/import, reset, tips.

### Task 10: Verificatie + deploy
Alle tests, build, doorspelen in browser op 1024×768 en 768×1024, push naar `origin main`, instructie Vercel-import.
