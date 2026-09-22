import { describe, it, expect } from 'vitest';
import { buildRound } from './round';
import { factsForIsland } from './facts';
import { newFactState, type FactState } from './leitner';

const T = '2026-09-21';
const seq = () => {
  let i = 0;
  return () => ((i++ * 7919) % 1000) / 1000;
};
const st = (box: number, due = T): FactState => ({ ...newFactState(), box, due });

function checkSpacing(qs: { key: string }[]) {
  for (let i = 1; i < qs.length; i++) expect(qs[i].key).not.toBe(qs[i - 1].key);
}

describe('buildRound', () => {
  it('first round: 4 new facts, each twice, spaced', () => {
    const qs = buildRound({ island: 0, facts: {}, unlocked: [0], today: T, rng: seq() });
    expect(qs.length).toBe(8);
    const keys = [...new Set(qs.map((q) => q.key))];
    expect(keys).toEqual(['1-1', '1-10', '1-2', '2-10']);
    for (const k of keys) {
      const idx = qs.map((q, i) => (q.key === k ? i : -1)).filter((i) => i >= 0);
      expect(idx.length).toBe(2);
      expect(idx[1] - idx[0]).toBeGreaterThanOrEqual(2);
    }
    checkSpacing(qs);
  });

  it('fills to 10 with reviews and max 3 new', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(0)) facts[k] = st(5, '2026-10-01');
    for (const k of ['2-2', '2-10', '2-5']) facts[k] = st(3);
    const qs = buildRound({ island: 1, facts, unlocked: [0, 1], today: T, rng: seq() });
    expect(qs.length).toBe(10);
    expect(new Set(qs.filter((q) => q.isNew).map((q) => q.key)).size).toBe(3);
    checkSpacing(qs);
  });

  it('no new facts while many are still being learned', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(2).slice(0, 6)) facts[k] = st(1);
    const qs = buildRound({ island: 2, facts, unlocked: [0, 1, 2], today: T, rng: seq() });
    expect(qs.some((q) => q.isNew)).toBe(false);
    expect(qs.length).toBeGreaterThan(0);
  });

  it('islands 0 and 1 allow more facts in progress before pausing new ones', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(1).slice(0, 6)) facts[k] = st(1);
    const qs = buildRound({ island: 1, facts, unlocked: [0, 1], today: T, rng: seq() });
    expect(qs.some((q) => q.isNew)).toBe(true);
  });

  it('island questions put the table second', () => {
    const qs = buildRound({ island: 1, facts: { '1-1': st(5, '2026-10-01') }, unlocked: [0, 1], today: T, rng: seq() });
    for (const q of qs.filter((q) => q.isNew)) expect(q.b).toBe(2);
  });

  it('random states never put the same fact twice in a row', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let run = 0; run < 300; run++) {
      const facts: Record<string, FactState> = {};
      const island = Math.floor(rnd() * 9);
      const unlocked = Array.from({ length: island + 1 }, (_, i) => i);
      for (const i of unlocked)
        for (const k of factsForIsland(i)) {
          const box = Math.floor(rnd() * 6);
          if (box) facts[k] = st(box, rnd() < 0.5 ? T : '2026-09-25');
        }
      const qs = buildRound({ island, facts, unlocked, today: T, rng: rnd });
      expect(qs.length).toBeGreaterThan(0);
      expect(qs.length).toBeLessThanOrEqual(10);
      checkSpacing(qs);
    }
  });

  it('never returns an empty round when everything is known', () => {
    const facts: Record<string, FactState> = {};
    for (const k of factsForIsland(0)) facts[k] = { ...st(5, '2026-10-01'), fastDays: [T, '2026-09-20'] };
    const qs = buildRound({ island: 0, facts, unlocked: [0], today: T, rng: seq() });
    expect(qs.length).toBe(10);
  });
});
