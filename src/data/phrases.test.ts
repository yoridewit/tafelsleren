import { describe, it, expect } from 'vitest';
import { PHRASES, PRAISE, factId, questionId } from './phrases';

describe('phrases', () => {
  it('covers every question and fact of the tables 1-10', () => {
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        expect(PHRASES[questionId(a, b)]).toBe(`${a} keer ${b}`);
        expect(PHRASES[factId(a, b)]).toBe(`${a} keer ${b} is ${a * b}.`);
      }
  });
  it('stays small enough for the ElevenLabs free tier (10.000 tekens)', () => {
    expect(Object.keys(PHRASES).length).toBe(200 + PRAISE.length + 3);
    expect(Object.values(PHRASES).join('').length).toBeLessThan(5000);
  });
});
