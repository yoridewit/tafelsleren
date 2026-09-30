import { describe, it, expect } from 'vitest';
import { applyAnswer, newFactState, isKnown, factStatus, isDue, fastLimitMs } from './leitner';

const T = '2026-09-21';

describe('leitner', () => {
  it('remembers the day a fact was first practiced', () => {
    const first = applyAnswer(newFactState(), true, 1000, T);
    expect(first.introduced).toBe(T);
    expect(applyAnswer(first, true, 1000, '2026-09-22').introduced).toBe(T);
  });

  it('fast correct on a new fact goes to box 2, due tomorrow', () => {
    const s = applyAnswer(newFactState(), true, 2000, T);
    expect(s.box).toBe(2);
    expect(s.due).toBe('2026-09-22');
    expect(s.fastDays).toEqual([T]);
  });
  it('slow correct on a new fact goes to box 1, due today', () => {
    const s = applyAnswer(newFactState(), true, 9000, T);
    expect(s.box).toBe(1);
    expect(s.due).toBe(T);
    expect(s.fastDays).toEqual([]);
  });
  it('wrong answer drops one box, never below 1', () => {
    const s = applyAnswer({ ...newFactState(), box: 4 }, false, 1000, T);
    expect(s.box).toBe(3);
    expect(s.wrong).toBe(1);
    expect(applyAnswer({ ...newFactState(), box: 1 }, false, 1000, T).box).toBe(1);
    expect(applyAnswer(newFactState(), false, 1000, T).box).toBe(1);
  });
  it('a slip (typo) costs nothing but still counts as seen', () => {
    const before = { ...newFactState(), box: 4, due: '2026-09-25', fastDays: ['2026-09-19', '2026-09-20'], seen: 6, wrong: 1 };
    const s = applyAnswer(before, false, 1000, T, { slip: true });
    expect(s).toEqual({ ...before, seen: 7 });
  });
  it('fast limit is 5 s for one digit answers and 7 s from 10 up', () => {
    expect(fastLimitMs(6)).toBe(5000);
    expect(fastLimitMs(9)).toBe(5000);
    expect(fastLimitMs(10)).toBe(7000);
    expect(fastLimitMs(100)).toBe(7000);
  });
  it('a slower answer counts as fast when a higher limit is given', () => {
    expect(applyAnswer(newFactState(), true, 6500, T).box).toBe(1);
    expect(applyAnswer(newFactState(), true, 6500, T, { fastMs: 7000 }).box).toBe(2);
    expect(applyAnswer(newFactState(), true, 5000, T).box).toBe(2);
  });
  it('box is capped at 5', () => {
    const s = applyAnswer({ ...newFactState(), box: 5 }, true, 1000, T);
    expect(s.box).toBe(5);
    expect(s.due).toBe('2026-09-28');
  });
  it('learns in steps: boxes 1 to 3 can be climbed on the same day', () => {
    let s = applyAnswer(newFactState(), true, 1000, T);
    expect(s.box).toBe(2);
    s = applyAnswer(s, true, 1000, T);
    expect(s.box).toBe(3);
    expect(s.due).toBe('2026-09-23');
  });
  it('from box 3 up it goes at most one box per day', () => {
    let s = applyAnswer({ ...newFactState(), box: 3 }, true, 1000, T);
    expect(s.box).toBe(4);
    s = applyAnswer(s, true, 1000, T);
    expect(s.box).toBe(4);
    s = applyAnswer(s, true, 1000, '2026-09-22');
    expect(s.box).toBe(5);
  });
  it('reaching box 3 uses up the day: no box 4 until tomorrow', () => {
    let s = applyAnswer({ ...newFactState(), box: 2 }, true, 1000, T);
    expect(s.box).toBe(3);
    s = applyAnswer(s, true, 1000, T);
    expect(s.box).toBe(3);
    s = applyAnswer(s, true, 1000, '2026-09-22');
    expect(s.box).toBe(4);
  });
  it('after a mistake it climbs back the same day through the learning boxes', () => {
    let s = applyAnswer({ ...newFactState(), box: 3 }, false, 1000, T);
    expect(s.box).toBe(2);
    s = applyAnswer(s, true, 1000, T);
    expect(s.box).toBe(3);
  });
  it('fast days are distinct', () => {
    let s = applyAnswer(newFactState(), true, 1000, T);
    s = applyAnswer(s, true, 1000, T);
    expect(s.fastDays).toEqual([T]);
  });
  it('known needs box 4 and two fast days', () => {
    expect(isKnown({ ...newFactState(), box: 5, fastDays: [T] })).toBe(false);
    expect(isKnown({ ...newFactState(), box: 4, fastDays: [T, '2026-09-22'] })).toBe(true);
    expect(isKnown({ ...newFactState(), box: 3, fastDays: [T, '2026-09-22'] })).toBe(false);
  });
  it('status', () => {
    expect(factStatus(undefined)).toBe('nieuw');
    expect(factStatus({ ...newFactState(), box: 2 })).toBe('oefenen');
    expect(factStatus({ ...newFactState(), box: 3 })).toBe('bijna');
    expect(factStatus({ ...newFactState(), box: 5, fastDays: [T] })).toBe('bijna');
    expect(factStatus({ ...newFactState(), box: 4, fastDays: [T, '2026-09-22'] })).toBe('gekend');
  });
  it('due', () => {
    expect(isDue({ ...newFactState(), box: 2, due: T }, T)).toBe(true);
    expect(isDue({ ...newFactState(), box: 2, due: '2026-09-22' }, T)).toBe(false);
    expect(isDue(newFactState(), T)).toBe(false);
  });
});
