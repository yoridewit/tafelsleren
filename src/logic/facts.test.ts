import { describe, it, expect } from 'vitest';
import { ALL_FACTS, factKey, parseFactKey, factsForIsland, introOrderForIsland, orientFact, ISLANDS } from './facts';
import { addDays, daysBetween, dayKey } from './dates';

describe('facts', () => {
  it('has 55 unique facts', () => {
    expect(ALL_FACTS.length).toBe(55);
    expect(new Set(ALL_FACTS).size).toBe(55);
  });
  it('normalises order', () => {
    expect(factKey(7, 3)).toBe('3-7');
    expect(factKey(3, 7)).toBe('3-7');
    expect(parseFactKey('3-7')).toEqual([3, 7]);
  });
  it('islands follow school order', () => {
    expect(ISLANDS.map((i) => i.tables)).toEqual([[1, 10], [2], [5], [3], [4], [6], [7], [8], [9]]);
  });
  it('island facts', () => {
    expect(factsForIsland(0).length).toBe(19);
    const two = factsForIsland(1);
    expect(two.length).toBe(10);
    expect(two).toContain('1-2');
    expect(two).toContain('2-10');
  });
  it('intro order starts with anchors', () => {
    expect(introOrderForIsland(1).slice(0, 4)).toEqual(['1-2', '2-2', '2-10', '2-5']);
    expect(introOrderForIsland(0).slice(0, 4)).toEqual(['1-1', '1-10', '1-2', '2-10']);
    expect(introOrderForIsland(1).length).toBe(10);
  });
  it('orients so the table is the second factor', () => {
    expect(orientFact('3-7', [7], () => 0)).toEqual({ a: 3, b: 7 });
    expect(orientFact('3-7', [3], () => 0)).toEqual({ a: 7, b: 3 });
  });
});

describe('dates', () => {
  it('adds days across months', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-09-21', 0)).toBe('2026-09-21');
  });
  it('counts days between', () => {
    expect(daysBetween('2026-09-21', '2026-09-24')).toBe(3);
  });
  it('formats local day', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
