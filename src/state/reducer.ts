import { applyAnswer, newFactState } from '../logic/leitner';
import { computeUnlocks, islandProgress, knownCount } from '../logic/progress';
import { currentStreak } from '../logic/streak';
import { ISLANDS, type FactKey } from '../logic/facts';
import { emptySave, type SaveData, type Settings } from '../logic/storage';
import { itemById, type ItemSlot } from '../data/shop';
import { earnedStickerIds } from '../data/stickers';

export interface AppState {
  save: SaveData | null;
  /** Stickers die net zijn verdiend (om te vieren). */
  newStickers: string[];
  /** Eilanden die net open zijn gegaan. */
  newUnlocks: number[];
}

export type Action =
  | { type: 'setup'; elfName: string }
  | { type: 'answer'; key: FactKey; correct: boolean; ms: number; today: string }
  | { type: 'tick'; today: string; deltaMs: number }
  | { type: 'finishRound'; correct: number; today: string }
  | { type: 'speedDone'; score: number; today: string }
  | { type: 'buy'; id: string }
  | { type: 'wear'; id: string }
  | { type: 'unwear'; slot: ItemSlot }
  | { type: 'discovered'; island: number }
  | { type: 'unlock'; island: number }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'rename'; elfName: string }
  | { type: 'import'; data: SaveData }
  | { type: 'reset' }
  | { type: 'clearCelebrations' };

export const STARS = { perCorrect: 1, roundDone: 3, firstRoundOfDay: 5 };

export function roundReward(correct: number, firstToday: boolean): number {
  return correct * STARS.perCorrect + STARS.roundDone + (firstToday ? STARS.firstRoundOfDay : 0);
}

export function speedReward(score: number): number {
  return Math.floor(score / 2);
}

export function initialState(save: SaveData | null): AppState {
  return { save, newStickers: [], newUnlocks: [] };
}

/** Na een ronde of snelspel: oefendag, eilanden en stickers bijwerken. */
function afterPlay(state: AppState, save: SaveData, today: string): AppState {
  const practiceDays = save.practiceDays.includes(today) ? save.practiceDays : [...save.practiceDays, today];
  const unlocked = computeUnlocks(save.facts, save.unlocked);
  const newUnlocks = unlocked.filter((i) => !save.unlocked.includes(i));
  const earned = earnedStickerIds({
    roundsDone: save.roundsDone,
    practiceDays: practiceDays.length,
    streak: currentStreak(practiceDays, today),
    known: knownCount(save.facts),
    masteredIslands: ISLANDS.map((_, i) => i).filter((i) => islandProgress(i, save.facts).mastered),
    speedRecord: save.speedRecord,
  });
  const newStickers = earned.filter((id) => !save.stickers.includes(id));
  return {
    ...state,
    save: { ...save, practiceDays, unlocked, stickers: [...save.stickers, ...newStickers] },
    newStickers,
    newUnlocks,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'setup') return initialState(emptySave(action.elfName));
  if (action.type === 'import') return initialState(action.data);
  if (action.type === 'reset') return initialState(null);
  if (action.type === 'clearCelebrations') return { ...state, newStickers: [], newUnlocks: [] };

  const save = state.save;
  if (!save) return state;
  const set = (patch: Partial<SaveData>): AppState => ({ ...state, save: { ...save, ...patch } });

  switch (action.type) {
    case 'answer': {
      const prev = save.facts[action.key] ?? newFactState();
      return set({ facts: { ...save.facts, [action.key]: applyAnswer(prev, action.correct, action.ms, action.today) } });
    }
    case 'tick': {
      // Geklemd tegen bijv. een dichtgeklapte laptop of systeemklok die verspringt.
      const delta = Math.max(0, Math.min(action.deltaMs, 5 * 60_000));
      if (delta === 0) return state;
      const already = save.timeByDay[action.today] ?? 0;
      return set({ timeByDay: { ...save.timeByDay, [action.today]: already + delta } });
    }
    case 'finishRound': {
      const already = save.roundsByDay[action.today] ?? 0;
      return afterPlay(state, {
        ...save,
        stars: save.stars + roundReward(action.correct, already === 0),
        roundsDone: save.roundsDone + 1,
        roundsByDay: { ...save.roundsByDay, [action.today]: already + 1 },
      }, action.today);
    }
    case 'speedDone':
      return afterPlay(state, {
        ...save,
        stars: save.stars + speedReward(action.score),
        speedRecord: Math.max(save.speedRecord, action.score),
      }, action.today);
    case 'buy': {
      const item = itemById(action.id);
      if (!item || save.owned.includes(item.id) || save.stars < item.price || !save.unlocked.includes(item.island))
        return state;
      return set({
        stars: save.stars - item.price,
        owned: [...save.owned, item.id],
        wearing: { ...save.wearing, [item.slot]: item.id },
      });
    }
    case 'wear': {
      const item = itemById(action.id);
      if (!item || !save.owned.includes(item.id)) return state;
      return set({ wearing: { ...save.wearing, [item.slot]: item.id } });
    }
    case 'unwear': {
      const wearing = { ...save.wearing };
      delete wearing[action.slot];
      return set({ wearing });
    }
    case 'discovered':
      return save.discovered.includes(action.island) ? state : set({ discovered: [...save.discovered, action.island] });
    case 'unlock':
      return save.unlocked.includes(action.island)
        ? state
        : set({ unlocked: [...save.unlocked, action.island].sort((a, b) => a - b) });
    case 'settings':
      return set({ settings: { ...save.settings, ...action.patch } });
    case 'rename':
      return set({ elfName: action.elfName });
  }
}
