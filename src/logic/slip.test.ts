import { describe, it, expect } from 'vitest';
import { isSlip } from './slip';

describe('isSlip', () => {
  it('pressing klaar too early is a slip (the given digits are the start of the answer)', () => {
    expect(isSlip('1', 18)).toBe(true);
    expect(isSlip('5', 54)).toBe(true);
    expect(isSlip('10', 100)).toBe(true);
  });
  it('swapped digits are a slip', () => {
    expect(isSlip('81', 18)).toBe(true);
    expect(isSlip('45', 54)).toBe(true);
  });
  it('a real miscalculation is not a slip', () => {
    expect(isSlip('19', 18)).toBe(false);
    expect(isSlip('16', 18)).toBe(false);
    expect(isSlip('180', 18)).toBe(false);
  });
  it('single digit answers are never slips', () => {
    expect(isSlip('8', 6)).toBe(false);
    expect(isSlip('6', 8)).toBe(false);
  });
  it('the right answer or nothing is not a slip', () => {
    expect(isSlip('18', 18)).toBe(false);
    expect(isSlip('', 18)).toBe(false);
  });
  it('palindromes and equal digits cannot be swapped', () => {
    expect(isSlip('11', 11)).toBe(false);
    expect(isSlip('22', 44)).toBe(false);
  });
});
