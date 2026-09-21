import { describe, it, expect } from 'vitest';
import { islandProgress, computeUnlocks, knownCount } from './progress';
import { factsForIsland } from './facts';
import { newFactState, type FactState } from './leitner';
import { currentStreak } from './streak';

const known: FactState = { ...newFactState(), box: 5, due: '2026-10-01', fastDays: ['2026-09-20', '2026-09-21'] };
const almost: FactState = { ...newFactState(), box: 3, due: '2026-10-01' };

describe('progress', () => {
  it('mastered needs all almost and 80% known', () => {
    const facts: Record<string, FactState> = {};
    const two = factsForIsland(1);
    two.forEach((k, i) => (facts[k] = i < 8 ? known : almost));
    expect(islandProgress(1, facts).mastered).toBe(true);
    facts[two[0]] = almost;
    expect(islandProgress(1, facts).mastered).toBe(false);
    expect(islandProgress(1, facts).known).toBe(7);
  });
  it('unlocks the next island after mastery, sticky', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(0)) facts[k] = known;
    expect(computeUnlocks(facts, [0])).toEqual([0, 1]);
    expect(computeUnlocks({}, [0, 1, 4])).toEqual([0, 1, 4]);
    expect(knownCount(facts)).toBe(19);
  });
});

describe('streak', () => {
  const T = '2026-09-21';
  it('counts with one missed day allowed', () => {
    expect(currentStreak([], T)).toBe(0);
    expect(currentStreak([T], T)).toBe(1);
    expect(currentStreak(['2026-09-19', T], T)).toBe(2);
    expect(currentStreak(['2026-09-17', T], T)).toBe(1);
    expect(currentStreak(['2026-09-19'], T)).toBe(1);
    expect(currentStreak(['2026-09-18'], T)).toBe(0);
    expect(currentStreak(['2026-09-15', '2026-09-16', '2026-09-18', '2026-09-20'], T)).toBe(4);
  });
});
