import { describe, it, expect } from 'vitest';
import { hintFor } from './hints';

describe('hints', () => {
  it('6 x 7 via 5 x 7', () => {
    const h = hintFor(6, 7);
    expect(h.steps).toContain('5 × 7 = 35');
    expect(h.steps).toContain('35 + 7 = 42');
  });
  it('9 x 4 via 10 x 4', () => {
    const h = hintFor(9, 4);
    expect(h.steps).toContain('10 × 4 = 40');
    expect(h.steps).toContain('40 − 4 = 36');
  });
  it('flips to the easier side', () => {
    const h = hintFor(7, 2);
    expect(h.flipped).toBe(true);
    expect(h.steps.join(' ')).toContain('2 × 7');
  });
  it('8 x 7 via doubling 4 x 7', () => {
    const h = hintFor(8, 7);
    expect(h.steps).toContain('4 × 7 = 28');
    expect(h.steps).toContain('28 + 28 = 56');
  });
  it('7 x 7 via 5 and 2', () => {
    expect(hintFor(7, 7).steps).toContain('35 + 14 = 49');
  });
  it('every fact has a hint ending in the right answer', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        const h = hintFor(a, b);
        expect(h.steps[h.steps.length - 1]).toMatch(new RegExp(`= ${a * b}$`));
      }
  });
});
