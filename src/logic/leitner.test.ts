import { describe, it, expect } from 'vitest';
import { applyAnswer, newFactState, isKnown, factStatus, isDue } from './leitner';

const T = '2026-09-21';

describe('leitner', () => {
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
  it('wrong answer drops to box 1', () => {
    const s = applyAnswer({ ...newFactState(), box: 4 }, false, 1000, T);
    expect(s.box).toBe(1);
    expect(s.wrong).toBe(1);
  });
  it('box is capped at 5', () => {
    const s = applyAnswer({ ...newFactState(), box: 5 }, true, 1000, T);
    expect(s.box).toBe(5);
    expect(s.due).toBe('2026-09-28');
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
