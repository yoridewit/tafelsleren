import { describe, it, expect } from 'vitest';
import { reducer, initialState, roundReward, type AppState } from './reducer';
import { emptySave, parseSave } from '../logic/storage';
import { factsForIsland } from '../logic/facts';

const T = '2026-09-21';
const started = (): AppState => reducer(initialState(null), { type: 'setup', elfName: 'Pip' });

describe('reducer', () => {
  it('setup creates a profile', () => {
    const s = started();
    expect(s.save?.elfName).toBe('Pip');
    expect(s.save?.unlocked).toEqual([0]);
  });

  it('answer updates the fact state', () => {
    const s = reducer(started(), { type: 'answer', key: '2-3', correct: true, ms: 1500, today: T });
    expect(s.save!.facts['2-3'].box).toBe(2);
  });

  it('round reward: 1 per correct + 3, +5 for first round of the day', () => {
    expect(roundReward(8, true)).toBe(16);
    expect(roundReward(8, false)).toBe(11);
  });

  it('finishRound gives stars, a practice day and the first sticker', () => {
    let s = reducer(started(), { type: 'finishRound', correct: 8, today: T });
    expect(s.save!.stars).toBe(16);
    expect(s.save!.practiceDays).toEqual([T]);
    expect(s.save!.stickers).toContain('eerste-ronde');
    expect(s.newStickers).toEqual(['eerste-ronde']);
    s = reducer(s, { type: 'finishRound', correct: 8, today: T });
    expect(s.save!.stars).toBe(27);
    expect(s.save!.roundsByDay[T]).toBe(2);
    expect(s.newStickers).toEqual([]);
  });

  it('finishRound unlocks the next island when mastered', () => {
    let s = started();
    for (const k of factsForIsland(0))
      s.save!.facts[k] = { box: 5, due: '2026-10-01', fastDays: ['2026-09-20', T], seen: 5, wrong: 0 };
    s = reducer(s, { type: 'finishRound', correct: 10, today: T });
    expect(s.save!.unlocked).toEqual([0, 1]);
    expect(s.newUnlocks).toEqual([1]);
    expect(s.save!.stickers).toContain('eiland-0');
  });

  it('buy needs enough stars and an open island, then wears the item', () => {
    let s = started();
    s = reducer(s, { type: 'buy', id: 'strik' });
    expect(s.save!.owned).toEqual([]);
    s.save!.stars = 100;
    s = reducer(s, { type: 'buy', id: 'kroon' });
    expect(s.save!.owned).toEqual([]);
    s = reducer(s, { type: 'buy', id: 'strik' });
    expect(s.save!.owned).toEqual(['strik']);
    expect(s.save!.stars).toBe(90);
    expect(s.save!.wearing.hoed).toBe('strik');
    s = reducer(s, { type: 'buy', id: 'strik' });
    expect(s.save!.stars).toBe(90);
  });

  it('wear and unwear', () => {
    let s = started();
    s.save!.owned = ['strik', 'feestmuts'];
    s = reducer(s, { type: 'wear', id: 'feestmuts' });
    expect(s.save!.wearing.hoed).toBe('feestmuts');
    s = reducer(s, { type: 'wear', id: 'kroon' });
    expect(s.save!.wearing.hoed).toBe('feestmuts');
    s = reducer(s, { type: 'unwear', slot: 'hoed' });
    expect(s.save!.wearing.hoed).toBeUndefined();
  });

  it('speedDone keeps the record and gives stars', () => {
    let s = reducer(started(), { type: 'speedDone', score: 12, today: T });
    expect(s.save!.speedRecord).toBe(12);
    expect(s.save!.stars).toBe(6);
    expect(s.save!.stickers).toContain('snel-10');
    s = reducer(s, { type: 'speedDone', score: 5, today: T });
    expect(s.save!.speedRecord).toBe(12);
  });

  it('unlock, settings, discovered, import, reset', () => {
    let s = reducer(started(), { type: 'unlock', island: 4 });
    expect(s.save!.unlocked).toEqual([0, 4]);
    s = reducer(s, { type: 'settings', patch: { sound: false } });
    expect(s.save!.settings).toEqual({
      sound: false,
      speech: true,
      music: true,
      musicVolume: 1,
      voice: null,
      dailyLimitMinutes: null,
    });
    s = reducer(s, { type: 'discovered', island: 2 });
    s = reducer(s, { type: 'discovered', island: 2 });
    expect(s.save!.discovered).toEqual([2]);
    const imported = { ...emptySave('Lila'), stars: 42 };
    s = reducer(s, { type: 'import', data: parseSave(JSON.parse(JSON.stringify(imported)))! });
    expect(s.save!.elfName).toBe('Lila');
    expect(s.save!.stars).toBe(42);
    s = reducer(s, { type: 'reset' });
    expect(s.save).toBeNull();
  });

  it('tick accumulates time per day and clamps huge jumps', () => {
    let s = reducer(started(), { type: 'tick', today: T, deltaMs: 90_000 });
    expect(s.save!.timeByDay[T]).toBe(90_000);
    s = reducer(s, { type: 'tick', today: T, deltaMs: 10_000 });
    expect(s.save!.timeByDay[T]).toBe(100_000);
    // een uur "verspringen" (bijv. dichtgeklapte laptop) telt maar voor 5 minuten mee
    s = reducer(s, { type: 'tick', today: T, deltaMs: 60 * 60_000 });
    expect(s.save!.timeByDay[T]).toBe(100_000 + 5 * 60_000);
    // negatieve delta (klok terug) telt niet mee
    s = reducer(s, { type: 'tick', today: T, deltaMs: -5000 });
    expect(s.save!.timeByDay[T]).toBe(100_000 + 5 * 60_000);
  });

  it('parseSave rejects other versions and repairs broken facts', () => {
    expect(parseSave({ version: 2 })).toBeNull();
    expect(parseSave('rommel')).toBeNull();
    const p = parseSave({ version: 1, facts: { '2-3': { box: 9 }, '2-4': { box: 2, due: T } }, unlocked: [3] });
    expect(Object.keys(p!.facts)).toEqual(['2-4']);
    expect(p!.unlocked).toEqual([0, 3]);
    expect(p!.settings.sound).toBe(true);
  });

  it('parseSave sanitizes timeByDay and dailyLimitMinutes', () => {
    const p = parseSave({
      version: 1,
      timeByDay: { [T]: 120_000, bad: -5, other: 'nope' },
      settings: { dailyLimitMinutes: 20 },
    });
    expect(p!.timeByDay).toEqual({ [T]: 120_000 });
    expect(p!.settings.dailyLimitMinutes).toBe(20);
    const q = parseSave({ version: 1, settings: { dailyLimitMinutes: -5 } });
    expect(q!.settings.dailyLimitMinutes).toBeNull();
    const r = parseSave({ version: 1 });
    expect(r!.timeByDay).toEqual({});
    expect(r!.settings.dailyLimitMinutes).toBeNull();
  });

  it('parseSave sanitizes musicVolume', () => {
    expect(parseSave({ version: 1, settings: { musicVolume: 0.4 } })!.settings.musicVolume).toBe(0.4);
    expect(parseSave({ version: 1, settings: { musicVolume: 1.5 } })!.settings.musicVolume).toBe(1);
    expect(parseSave({ version: 1, settings: { musicVolume: -0.2 } })!.settings.musicVolume).toBe(1);
    expect(parseSave({ version: 1 })!.settings.musicVolume).toBe(1);
  });
});
